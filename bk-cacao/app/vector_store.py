import os
from typing import List
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document

VECTOR_STORE_PATH = "./faiss_index"

# Sử dụng model HuggingFace nhẹ để tạo Vector Embeddings local
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

def get_vector_store() -> FAISS:
    """Load hoặc khởi tạo FAISS vector store."""
    if os.path.exists(VECTOR_STORE_PATH) and os.path.exists(os.path.join(VECTOR_STORE_PATH, "index.faiss")):
        try:
            return FAISS.load_local(VECTOR_STORE_PATH, embeddings, allow_dangerous_deserialization=True)
        except Exception as e:
            print(f"Error loading FAISS: {e}")
            pass
            
    # Tạo vector store rỗng (Cần một document mẫu để khởi tạo schema)
    dummy_doc = Document(page_content="dummy init", metadata={"id": -1})
    vs = FAISS.from_documents([dummy_doc], embeddings)
    vs.save_local(VECTOR_STORE_PATH)
    return vs

def add_product_to_vector_store(product_id: int, name: str, description: str):
    """Mã hóa Tên và Mô tả sản phẩm, sau đó lưu vào FAISS."""
    vs = get_vector_store()
    text = f"Name: {name}. Description: {description or ''}"
    doc = Document(page_content=text, metadata={"id": product_id})
    vs.add_documents([doc])
    vs.save_local(VECTOR_STORE_PATH)

def search_similar_product_ids(query: str, k: int = 5) -> List[int]:
    """Tìm kiếm các sản phẩm tương đồng và trả về danh sách ID."""
    vs = get_vector_store()
    # Tìm kiếm theo thuật toán Cosine Similarity / L2
    results = vs.similarity_search(query, k=k)
    
    product_ids = []
    for doc in results:
        pid = doc.metadata.get("id", -1)
        if pid != -1:
            product_ids.append(pid)
            
    return product_ids

def reset_vector_store():
    """Xóa bỏ FAISS Index cũ và tạo mới."""
    import shutil
    if os.path.exists(VECTOR_STORE_PATH):
        shutil.rmtree(VECTOR_STORE_PATH)
    get_vector_store()
