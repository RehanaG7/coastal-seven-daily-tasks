from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, model_validator

class ProductBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=100)
    description: str = Field("", max_length=255)
    price: float = Field(..., gt=0)
    stock: int = Field(0, ge=0)

class ProductCreate(ProductBase):
    owner_id: int

class ProductUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    price: float | None = Field(None, gt=0)
    stock: int | None = Field(None, ge=0)

    @model_validator(mode="after")
    def check_at_least_one_field(self):
        if not any([self.title, self.description, self.price is not None, self.stock is not None]):
            raise ValueError("At least one field must be provided for update")
        return self

class ProductRead(ProductBase):
    id: int
    owner_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)