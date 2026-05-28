from fastapi import FastAPI
from .routers import pricing, market, portfolio, auth
from .database import Base, engine
from . import models
from fastapi.middleware.cors import CORSMiddleware


Base.metadata.create_all(bind=engine)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://equirisk.vercel.app",

    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/")
def root():
    return { "message": "EquiRisk API is running"}
@app.get("/health")
def health_check():
    return {"status": "ok"}



app.include_router(pricing.router)
app.include_router(market.router)
app.include_router(portfolio.router)
app.include_router(auth.router)