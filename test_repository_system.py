#!/usr/bin/env python3
"""Quick test script for repository management system."""

import json
import time

import requests

# Test data
test_repo = {
    "name": "test-repo",
    "url": "https://github.com/test/test-repo",
    "description": "Test repository for validation",
}


def test_repository_endpoints():
    """Test all repository CRUD endpoints."""
    base_url = "http://localhost:8000/api/repositories"

    print("🧪 Testing Repository Management System...")

    try:
        # Test 1: Get initial repository list
        print("\n1. Getting initial repository list...")
        response = requests.get(base_url)
        if response.status_code == 200:
            repos = response.json()
            print(f"✅ Found {len(repos)} existing repositories")
            for repo in repos:
                print(f"   - {repo['name']}: {repo['url']}")
        else:
            print(f"❌ Failed to get repositories: {response.status_code}")
            print(response.text)
            return

        # Test 2: Create a new repository
        print("\n2. Creating new repository...")
        response = requests.post(base_url, json=test_repo)
        if response.status_code == 201:
            new_repo = response.json()
            repo_id = new_repo["id"]
            print(f"✅ Created repository: {new_repo['name']} (ID: {repo_id})")
        else:
            print(f"❌ Failed to create repository: {response.status_code}")
            print(response.text)
            return

        # Test 3: Get the specific repository
        print("\n3. Getting specific repository...")
        response = requests.get(f"{base_url}/{repo_id}")
        if response.status_code == 200:
            repo = response.json()
            print(f"✅ Retrieved repository: {repo['name']}")
        else:
            print(f"❌ Failed to get repository: {response.status_code}")
            print(response.text)

        # Test 4: Update the repository
        print("\n4. Updating repository...")
        updated_data = {
            "name": "updated-test-repo",
            "url": "https://github.com/test/updated-test-repo",
            "description": "Updated test repository",
        }
        response = requests.put(f"{base_url}/{repo_id}", json=updated_data)
        if response.status_code == 200:
            updated_repo = response.json()
            print(f"✅ Updated repository: {updated_repo['name']}")
        else:
            print(f"❌ Failed to update repository: {response.status_code}")
            print(response.text)

        # Test 5: Get repository statistics
        print("\n5. Getting repository statistics...")
        response = requests.get(f"{base_url}/stats/summary")
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ Statistics: {stats}")
        else:
            print(f"❌ Failed to get statistics: {response.status_code}")
            print(response.text)

        # Test 6: List backups
        print("\n6. Listing backups...")
        response = requests.get(f"{base_url}/backups/list")
        if response.status_code == 200:
            backups = response.json()
            print(f"✅ Found {len(backups.get('backups', []))} backup files")
        else:
            print(f"❌ Failed to list backups: {response.status_code}")
            print(response.text)

        # Test 7: Delete the repository
        print("\n7. Deleting repository...")
        response = requests.delete(f"{base_url}/{repo_id}")
        if response.status_code == 204:
            print("✅ Repository deleted successfully")
        else:
            print(f"❌ Failed to delete repository: {response.status_code}")
            print(response.text)

        # Test 8: Verify deletion
        print("\n8. Verifying deletion...")
        response = requests.get(f"{base_url}/{repo_id}")
        if response.status_code == 404:
            print("✅ Repository confirmed deleted")
        else:
            print(f"❌ Repository still exists: {response.status_code}")

        print("\n🎉 All tests completed!")

    except requests.exceptions.ConnectionError:
        print(
            "❌ Could not connect to server. Make sure the backend is running on localhost:8000"
        )
    except Exception as e:
        print(f"❌ Test failed with error: {e}")


def test_validation():
    """Test input validation."""
    print("\n🧪 Testing Input Validation...")
    base_url = "http://localhost:8000/api/repositories"

    # Test invalid data
    invalid_repos = [
        {"name": "", "url": "https://github.com/test/test"},  # Empty name
        {"name": "test", "url": "invalid-url"},  # Invalid URL
        {"name": "a" * 101, "url": "https://github.com/test/test"},  # Name too long
    ]

    for i, invalid_repo in enumerate(invalid_repos, 1):
        print(f"\n{i}. Testing invalid repo: {invalid_repo}")
        try:
            response = requests.post(base_url, json=invalid_repo)
            if response.status_code in [400, 422]:
                print(f"✅ Validation correctly rejected: {response.status_code}")
            else:
                print(f"❌ Validation failed: {response.status_code}")
                print(response.text)
        except Exception as e:
            print(f"❌ Error testing validation: {e}")


if __name__ == "__main__":
    # Wait a moment for server to start
    print("Waiting for server to start...")
    time.sleep(3)

    test_repository_endpoints()
    test_validation()
