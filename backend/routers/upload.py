from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from typing import List
from dependencies import get_current_user
from models import UserProfile
import cloudinary
import cloudinary.uploader
import os
import io
from PIL import Image, UnidentifiedImageError

router = APIRouter(prefix="/upload", tags=["Upload"])

# Configure Cloudinary from environment variables
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

# Allowed image types
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP", "GIF"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


def validate_image(file: UploadFile, contents: bytes) -> None:
    """Validate uploaded image file by MIME type and image bytes."""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_TYPES)}"
        )

    if not contents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty file upload is not allowed"
        )

    try:
        with Image.open(io.BytesIO(contents)) as img:
            img.verify()
        with Image.open(io.BytesIO(contents)) as img:
            img_format = (img.format or "").upper()
    except (UnidentifiedImageError, OSError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image file"
        )

    if img_format not in ALLOWED_FORMATS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image format. Allowed formats: {', '.join(ALLOWED_FORMATS)}"
        )


@router.post("/image")
async def upload_single_image(
    file: UploadFile = File(...),
    current_user: UserProfile = Depends(get_current_user)
):
    """Upload a single image to Cloudinary. Returns the secure URL."""
    # Read file content
    contents = await file.read()

    # Check file size
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB"
        )

    validate_image(file, contents)

    try:
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            contents,
            folder="unimart/products",
            resource_type="image",
            transformation=[
                {"width": 800, "height": 800, "crop": "limit"},
                {"quality": "auto:good"},
                {"fetch_format": "auto"}
            ]
        )

        return {
            "url": result["secure_url"],
            "public_id": result["public_id"],
            "width": result.get("width"),
            "height": result.get("height"),
        }
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Upload failed. Please try again."
        )


@router.post("/images")
async def upload_multiple_images(
    files: List[UploadFile] = File(...),
    current_user: UserProfile = Depends(get_current_user)
):
    """Upload multiple images (max 4) to Cloudinary. Returns list of secure URLs."""
    if len(files) > 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 4 images allowed"
        )

    if len(files) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one image is required"
        )

    uploaded_urls = []

    for file in files:
        contents = await file.read()

        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File '{file.filename}' too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB"
            )

        validate_image(file, contents)

        try:
            result = cloudinary.uploader.upload(
                contents,
                folder="unimart/products",
                resource_type="image",
                transformation=[
                    {"width": 800, "height": 800, "crop": "limit"},
                    {"quality": "auto:good"},
                    {"fetch_format": "auto"}
                ]
            )
            uploaded_urls.append(result["secure_url"])
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Upload failed for '{file.filename}'. Please try again."
            )

    return {"urls": uploaded_urls}
