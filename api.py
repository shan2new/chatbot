from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pymongo import MongoClient
from langchain_mongodb import MongoDBAtlasVectorSearch
from langchain_openai import OpenAIEmbeddings
from openai import OpenAI
from langchain_community.chat_models import ChatOpenAI
import os
from dotenv import load_dotenv
import pdb

load_dotenv()

# Load environment variables
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
MONGODB_URI = os.getenv('MONGODB_URI')

# Set OpenAI API key
openai_api_key = OPENAI_API_KEY
openai = OpenAI(api_key=openai_api_key)

# MongoDB setup
client = MongoClient(MONGODB_URI)
db = client["dental_chatbot"]
collection = db["specialties"]
chat_history_collection = db["chat_history"]

app = FastAPI()

class QueryRequest(BaseModel):
    session_id: str
    query: str

class QueryResponse(BaseModel):
    answer: str

def get_vector_search():
    embeddings = OpenAIEmbeddings(openai_api_key=openai_api_key)
    vector_search = MongoDBAtlasVectorSearch(
        collection=collection,
        embedding=embeddings,
        index_name="vector_index"
    )
    return vector_search

def save_message(session_id, role, content):
    chat_history_collection.insert_one({
        "session_id": session_id,
        "role": role,
        "content": content
    })

def get_chat_history(session_id):
    messages = list(chat_history_collection.find({"session_id": session_id}).sort("timestamp"))
    chat_history = [{"role": message["role"], "content": message["content"]} for message in messages]
    return chat_history

@app.post("/query", response_model=QueryResponse)
async def query(request: QueryRequest):
    vector_search = get_vector_search()
    docs = vector_search.similarity_search(request.query, k=1)
    if not docs:
        raise HTTPException(status_code=404, detail="Sorry, we couldn't find any relevant answer")
    relevant_text = docs[0].page_content

    # Retrieve chat history
    chat_history = get_chat_history(request.session_id)
    chat_history.append({"role": "user", "content": request.query})

    response = openai.chat.completions.create(
        model="gpt-4",
        messages=chat_history + [
            {"role": "system", "content": "You are a helpful assistant for a dental company named Apollo. If you can't find the answer, tell the user to reach Apollo using information shared. The document is not provided by the user but the company Apollo but it added there. Don't mention it in our discussion. "},
            {"role": "user", "content": f"Answer the question based on the following:\n\n{relevant_text}\n\nQuestion: {request.query}. If you don't find an answer, ask me to contact Apollo with their phone number. Do not use the word document to represent the data provided to you."}
        ],
        max_tokens=150
    )

    assistant_message = response.choices[0].message.content.strip()

    # Save user and assistant messages
    save_message(request.session_id, "user", request.query)
    save_message(request.session_id, "assistant", assistant_message)

    # pdb.set_trace()
    return QueryResponse(answer=assistant_message)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
