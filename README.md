# CE10-demo-lingo
Creating a webapp with 3 service. A game, API and Database. Learning how to containerise it and upload into AWS EKS and Kubernetes.

Lingo Game - Kubernetes Deployment Guide
Project Structure
lingo-k8s/
├── frontend/
│   ├── index.html
│   ├── script.js  
│   ├── styles.css
│   ├── nginx.conf
│   └── Dockerfile
├── api/
│   ├── server.js
│   ├── package.json
│   └── Dockerfile
└── k8s/
    ├── namespace.yaml
    ├── frontend/
    │   ├── deployment.yaml
    │   └── service.yaml
    ├── api/
    │   ├── deployment.yaml
    │   └── service.yaml
    ├── database/
    │   ├── deployment.yaml
    │   ├── service.yaml
    │   └── persistent-volume.yaml
    └── ingress.yaml
 

