<div align="left">

# 🛒 Dumbara Super Market — Intelligent Retail & POS System

**An AI-powered Point of Sale (POS), Inventory Management, and Market Intelligence platform built for modern supermarket operations.**

[![React](https://img.shields.io/badge/Frontend-React.js-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js_%26_Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![SQLite](https://img.shields.io/badge/Database-SQLite3-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Puppeteer](https://img.shields.io/badge/Scraping-Puppeteer-40B5A4?style=for-the-badge&logo=puppeteer&logoColor=white)](https://pptr.dev/)
[![AI Engine](https://img.shields.io/badge/AI-Apriori_Market_Basket-FF6F00?style=for-the-badge)](#ai--autonomous-intelligence-engines)

[Core Modules](#-core-system-modules) • [AI Engines](#-ai--autonomous-intelligence-engines) • [Security & RBAC](#-security--role-based-access-control) • [Tech Stack](#-technology-stack) • [API Reference](#-api-endpoints-overview) • [Quick Start](#-quick-start-guide)

</div>

---

## 🎯 About The Project

**Dumbara Super Market** is a full-stack retail management and analytics solution designed to streamline daily supermarket operations—from barcode-driven checkout billing and supplier tracking to automated competitor price monitoring and AI-based product bundling.

Unlike traditional POS systems that only record transactions, this platform actively analyzes sales patterns and external supermarket benchmarks in the background to alert managers about pricing gaps and cross-selling opportunities in real time.

### System Architecture Flow

```text
┌──────────────────────┐      REST API (x-user-name Auth)      ┌──────────────────────────┐
│   React.js Frontend  │ ◄───────────────────────────────────► │  Node.js + Express API   │
│  (POS, Analytics &   │                                       │  (RBAC, OTP & Business   │
│   Toast Alert UI)    │                                       │         Logic)           │
└──────────────────────┘                                       └────────────┬─────────────┘
                                                                            │
                         ┌──────────────────────────────────────────────────┼─────────────────┐
                         ▼                                                  ▼                 ▼
            ┌─────────────────────────┐                       ┌───────────────────┐  ┌──────────────────┐
            │    SQLite3 Database     │                       │  Apriori Mining   │  │ Puppeteer Live   │
            │ (Products, Invoices,    │                       │      Engine       │  │  Price Scraper   │
            │  Users, Notifications)  │                       │ (Combo Discovery) │  │ (Keells/Market)  │
            └─────────────────────────┘                       └───────────────────┘  └──────────────────┘
