from app.core.security import create_access_token
from app.models import Report, ReportStatusEnum, ReportTypeEnum
from decimal import Decimal

def test_graphql_admin_queries_and_mutations(client, db_session, sample_data):
    admin = sample_data["admin"]
    buyer = sample_data["buyer"]
    seller = sample_data["seller"]
    store = sample_data["store"]
    product = sample_data["product"]

    # Tạo một báo cáo mẫu
    report = Report(
        reporter_id=buyer.id,
        reported_store_id=store.id,
        reported_user_id=None,
        report_type=ReportTypeEnum.STORE_VIOLATION,
        reason="Tranh vẽ AI giả mạo",
        status=ReportStatusEnum.PENDING,
    )
    db_session.add(report)
    db_session.commit()

    # Tạo token truy cập cho admin
    admin_token = create_access_token(str(admin.id))
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Kiểm tra query adminStats
    query_stats = """
    query {
      adminStats {
        totalUsers
        totalOrders
        totalProducts
        totalStores
        totalRevenue
        pendingOrders
      }
    }
    """
    response = client.post("/graphql", json={"query": query_stats}, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "errors" not in data
    stats = data["data"]["adminStats"]
    assert stats["totalUsers"] >= 3
    assert stats["totalProducts"] >= 1

    # 2. Kiểm tra query adminUsers
    query_users = """
    query {
      adminUsers(page: 1, limit: 10) {
        items {
          id
          email
          username
          role
          isActive
        }
        totalItems
        totalPages
      }
    }
    """
    response = client.post("/graphql", json={"query": query_users}, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "errors" not in data
    assert len(data["data"]["adminUsers"]["items"]) >= 3

    # 3. Kiểm tra query adminReports
    query_reports = """
    query {
      adminReports(page: 1, limit: 10) {
        items {
          id
          reason
          status
          reportedStore {
            name
          }
        }
        totalItems
      }
    }
    """
    response = client.post("/graphql", json={"query": query_reports}, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "errors" not in data
    reports = data["data"]["adminReports"]["items"]
    assert len(reports) >= 1
    assert reports[0]["reason"] == "Tranh vẽ AI giả mạo"

    # 4. Kiểm tra mutation banUser
    mutation_ban = f"""
    mutation {{
      banUser(userId: "{buyer.id}") {{
        id
        isActive
      }}
    }}
    """
    response = client.post("/graphql", json={"query": mutation_ban}, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "errors" not in data
    assert data["data"]["banUser"]["isActive"] is False

    # 5. Kiểm tra mutation resolveReport
    mutation_resolve = f"""
    mutation {{
      resolveReport(reportId: "{report.id}") {{
        id
        status
      }}
    }}
    """
    response = client.post("/graphql", json={"query": mutation_resolve}, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "errors" not in data
    assert data["data"]["resolveReport"]["status"] == "RESOLVED"

    # 6. Kiểm tra chặn truy cập khi không phải admin
    buyer_token = create_access_token(str(buyer.id))
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}
    response = client.post("/graphql", json={"query": query_stats}, headers=buyer_headers)
    assert response.status_code == 200
    data = response.json()
    assert "errors" in data
    assert "Not authorized" in data["errors"][0]["message"]
