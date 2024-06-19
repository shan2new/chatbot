import os
import requests
from bs4 import BeautifulSoup
from pymongo import MongoClient
from openai import OpenAI
from dotenv import load_dotenv


load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

openai = OpenAI(api_key=OPENAI_API_KEY)

client = MongoClient(MONGODB_URI)
db = client["dental_chatbot"]
collection = db["specialties"]

base_url = "https://apollodental.in"
url = f"{base_url}/specialties"

def generate_embedding(text):
    response = openai.embeddings.create(
        input=text,
        model="text-embedding-ada-002"
    )
    return response.data[0].embedding

def scrape_data():
    try:
        response = requests.get(url)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, "html.parser")

        specialties = []

        links = [a['href'] for a in soup.select("#hospitals a")]

        for link in links:
            specialty_page = requests.get(f"{base_url}{link}")
            specialty_page.raise_for_status()
            specialty_soup = BeautifulSoup(specialty_page.content, "html.parser")

            title = specialty_soup.select_one(".specialities-banner h1").get_text(strip=True)
            content_section = specialty_soup.select_one(".specialities-main .question")
            
            paragraphs = content_section.find_all(['p', 'h4', 'ul'])
            content = []
            current_header = ""
            for element in paragraphs:
                if element.name == 'h4':
                    current_header = element.get_text(strip=True)
                elif element.name == 'p':
                    content.append((current_header, element.get_text(strip=True)))
                elif element.name == 'ul':
                    list_items = [li.get_text(strip=True) for li in element.find_all('li')]
                    content.append((current_header, ', '.join(list_items)))

            description = " ".join([text for header, text in content])
            text_content = f"{title} {description}"
            embedding = generate_embedding(text_content)

            specialties.append({
                "title": title,
                "description": description,
                "embedding": embedding,
                "link": f"{base_url}{link}",
                "text": text_content
            })

        collection.delete_many({})
        collection.insert_many(specialties)
        print("Data scraped and stored in MongoDB successfully.")

    except Exception as e:
        print(f"Error scraping data: {e}")

if __name__ == "__main__":
    scrape_data()