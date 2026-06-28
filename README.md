# RiskMate 🛡️

A web-based cybersecurity risk management platform built with Flask and MySQL, implementing industry-standard frameworks **NIST SP 800-30** and **ISO/IEC 27005** for structured risk assessment and mitigation.

## Tech Stack
- **Backend:** Python, Flask, Flask-WTF
- **Database:** MySQL
- **Security Tools:** Nmap, OWASP ZAP
- **Frontend:** HTML, CSS, JavaScript
- **Frameworks:** NIST SP 800-30, ISO/IEC 27005

## Features
- **Asset Inventory** — Track and manage organizational assets
- **Risk Register** — Document and monitor identified risks
- **Risk Assessment** — Evaluate likelihood and impact of threats
- **Risk Analysis** — Analyze risks using NIST/ISO frameworks
- **Risk Response** — Plan and track mitigation strategies
- **Reporting Module** — Generate dynamic risk reports with filters
- **Nmap Integration** — Automated network scanning and device discovery
- **OWASP ZAP Integration** — Web application vulnerability scanning
- **User Management** — Role-based access control
- **Export** — CSV/Excel report exports

## Setup

### Prerequisites
- Python 3.8+
- MySQL Server
- Nmap (optional, for network scanning)
- OWASP ZAP (optional, for vulnerability scanning)

### Installation

```bash
# Clone the repository
git clone https://github.com/alishi-215/RiskMate
cd RiskMate

# Install dependencies
pip install -r requirements.txt
```

### Configure Environment
Create a `.env` file in the root directory:
```
MYSQL_HOST=localhost
MYSQL_USER=your_mysql_user
MYSQL_PASSWORD=your_mysql_password
MYSQL_DB=RiskMate_MySQL
SECRET_KEY=your_secret_key
```

### Database Setup
```bash
# Create database in MySQL
mysql -u root -p
CREATE DATABASE RiskMate_MySQL;
```

### Run
```bash
python "final_app.py"
```

Open: http://localhost:5000

## Project Structure
```
RiskMate/
├── final_app.py          # Main Flask application
├── templates/            # HTML templates
│   ├── dashboard2.html
│   ├── asset_inventory.html
│   ├── risk_register.html
│   ├── risk_assessment.html
│   ├── analyze_risk.html
│   ├── respond_to_risk.html
│   └── risk-reporting.html
├── static/               # CSS and JavaScript files
├── requirements.txt
└── README.md
```

## Frameworks Implemented
- **NIST SP 800-30** — Risk assessment guide for information systems
- **ISO/IEC 27005** — Information security risk management standard

## Disclaimer
This tool is intended for educational and authorized security assessment purposes only.
