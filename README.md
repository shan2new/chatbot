Technologies Used:

Backend: FastAPI/Python

Frontend: NextJS/Typescript

Containerization: Docker

Cloud Provider: AWS Elastic Container Services

Infrastructure as Code: Terraform

Database: MongoDB (Atlas)

LLM: OpenAI GPT-4 API for text search and completions

Persistent Memory: App remembers your conversations on reload and previous conversations

Deployment URL: https://chatbot.thirdarm.in (An access token is required to access this)

Additional Info:

1. AWS Elastic Container Service Integration: Completely hosted via AWS ECS with fargate implementation
2. Terraform: IaaC for creating all the resources in AWS
3. Streaming Responses: Implemented streaming responses for a more interactive user experience, similar to how ChatGPT streams responses.
4. User Authentication: Added an authentication mechanism to secure access to the chatbot using a fix access token to prevent external abuse.
5. Extended Conversation Memory: Implemented persistent memory, allowing the chatbot to remember and recall previous conversations across sessions.
6. Enhanced User Interface: Developed a user-friendly and responsive UI using Material UI in the NextJS frontend.
