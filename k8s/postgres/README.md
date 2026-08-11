# Template to create Kubernetes secrets for Postgres credentials
# Create the secret using:
# kubectl -n apipulse create secret generic postgres-secret \
#   --from-literal=POSTGRES_USER=apipulse_user \
#   --from-literal=POSTGRES_PASSWORD='replace-with-strong-password'
#
# This file is only a template and SHOULD NOT be applied with cleartext credentials in the repo.

# Example (DO NOT COMMIT your plain secrets):
# apiVersion: v1
# kind: Secret
# metadata:
#   name: postgres-secret
#   namespace: apipulse
# type: Opaque
# data:
#   POSTGRES_USER: <base64-encoded-user>
#   POSTGRES_PASSWORD: <base64-encoded-password>
