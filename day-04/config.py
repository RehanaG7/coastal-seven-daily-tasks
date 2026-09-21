import os
import logging

DB_URL = os.getenv("DATABASE_URL", "postgresql://neondb_owner:npg_mDkj1JE8pIFH@ep-damp-cloud-b5p92uap-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require")

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