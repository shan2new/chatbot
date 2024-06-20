import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient, ASCENDING
from langchain_mongodb import MongoDBAtlasVectorSearch
from langchain_openai import OpenAIEmbeddings
from openai import OpenAI
from dotenv import load_dotenv
import logging

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
MONGODB_URI = os.getenv('MONGODB_URI')
APP_ACCESS_TOKEN = os.getenv('APP_ACCESS_TOKEN')

# Ensure environment variables are set
if not OPENAI_API_KEY or not MONGODB_URI or not APP_ACCESS_TOKEN:
    logger.error("Required environment variables are missing.")
    raise ValueError("Required environment variables are missing.")

# Set OpenAI API key
openai = OpenAI(api_key=OPENAI_API_KEY)

# MongoDB setup
client = MongoClient(MONGODB_URI)
db = client["dental_chatbot"]
collection = db["specialties"]
chat_history_collection = db["chat_history"]

# Ensure indexes exist
chat_history_collection.create_index([("session_id", ASCENDING), ("timestamp", ASCENDING)])

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    access_token: str
    session_id: str
    query: str

class QueryResponse(BaseModel):
    answer: str

def get_vector_search():
    embeddings = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)
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

@app.post("/api/query", response_model=QueryResponse)
async def query(request: QueryRequest):
    if request.access_token != APP_ACCESS_TOKEN:
        logger.warning("Unauthorized access attempt.")
        raise HTTPException(
            status_code=401,
            detail="Unauthorized",
            headers={"WWW-Authenticate": "Bearer"},
        )
    vector_search = get_vector_search()
    docs = vector_search.similarity_search(request.query, k=1)
    if not docs:
        logger.info("No relevant documents found for query: %s", request.query)
        raise HTTPException(status_code=404, detail="Sorry, we couldn't find any relevant answer")
    relevant_text = docs[0].page_content

    # Retrieve chat history
    chat_history = get_chat_history(request.session_id)
    chat_history.append({"role": "user", "content": request.query})

    try:
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=chat_history + [
                {"role": "system", "content": "You are a helpful assistant for a dental company named Apollo. If you can't find the answer, tell the user to reach Apollo using information shared. The document is not provided by the user but the company Apollo but it added there. Don't mention it in our discussion. "},
                {"role": "user", "content": f"Answer the question based on the following:\n\n{relevant_text}\n\nQuestion: {request.query}. If you don't find an answer, ask me to contact Apollo with their phone number. Do not use the word document to represent the data provided to you."}
            ],
            max_tokens=150
        )

        assistant_message = response.choices[0].message.content.strip()

    except error as e:
        logger.error("OpenAI API request failed: %s", e)
        raise HTTPException(status_code=500, detail="An error occurred while processing your request. Please try again later.")

    # Save user and assistant messages
    save_message(request.session_id, "user", request.query)
    save_message(request.session_id, "assistant", assistant_message)

    return QueryResponse(answer=assistant_message)

@app.get("/api")
async def health():
    return 'Healthy!'

@app.get("/")
async def health():
    return 'Healthy!'

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
