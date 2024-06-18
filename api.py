from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pymongo import MongoClient
from langchain_mongodb import MongoDBAtlasVectorSearch
from langchain_openai import OpenAIEmbeddings
from openai import OpenAI
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

app = FastAPI()

class QueryRequest(BaseModel):
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

@app.post("/query", response_model=QueryResponse)
async def query(request: QueryRequest):
    vector_search = get_vector_search()
    docs = vector_search.similarity_search(request.query, k=1)
    if not docs:
        raise HTTPException(status_code=404, detail="No relevant information found.")
    relevant_text = docs[0].page_content
    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": f"Answer the question based on the following context:\n\n{relevant_text}\n\nQuestion: {request.query}"}
        ],
        max_tokens=150
    )
    # pdb.set_trace()
    return QueryResponse(answer=response.choices[0].message.content.strip())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
