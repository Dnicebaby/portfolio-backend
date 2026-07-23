services:
  - type: web
    name: portfolio-backend
    env: node
    plan: free
    buildCommand: npm install
    startCommand: node server.js
    nodeVersion: "20"
    envVars:
      - key: CLOUDINARY_CLOUD_NAME
        value: oduiur9j
      - key: CLOUDINARY_API_KEY
        sync: false
      - key: CLOUDINARY_API_SECRET
        sync: false
