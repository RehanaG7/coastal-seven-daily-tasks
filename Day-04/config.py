import os
import logging
from dotenv import load_dotenv

# Load local environment variables from a .env file (if present)
load_dotenv()

# Read strictly from the environment; provide only a dummy placeholder as fallback
DB_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://neondb_owner:YOUR_PASSWORD_HERE@ep-damp-cloud-b5p92uap-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require"
)

# Configure standardized application logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler("task_manager.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("TaskManagerApp")