import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import './Report.css';
import bgImage from './assets/abc.avif';
import Header from './Header';

function Report() {
    const [reports, setReports] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddReportOpen, setIsAddReportOpen] = useState(false);

    // 📄 Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Form States
    const [nextReportID, setNextReportID] = useState('REP1');
    const [reportType, setReportType] = useState('Sales Report');
    const [invoiceYears, setInvoiceYears] = useState([]);
    
    // Time Range States
    const [fromYear, setFromYear] = useState('');
    const [fromMonth, setFromMonth] = useState('Jan');
    const [fromDate, setFromDate] = useState('01');
    
    const [toYear, setToYear] = useState('');
    const [toMonth, setToMonth] = useState('Jan');
    const [toDate, setToDate] = useState('01');

    // Report Generating Loader State
    const [isGenerating, setIsGenerating] = useState(false);

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

    // Auth Header Helper
    const getAuthHeaders = (extraHeaders = {}) => {
        const username = sessionStorage.getItem('userName') || localStorage.getItem('userName') || '';
        return {
            'x-user-name': username,
            ...extraHeaders
        };
    };

    // Fetch report data
    const fetchReports = () => {
        fetch('http://localhost:5000/api/get-reports', {
            headers: getAuthHeaders()
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setReports(data);
                } else {
                    setReports([]);
                }
            })
            .catch(err => {
                console.error("Error fetching reports:", err);
                setReports([]);
            });
    };

    // Open the PDF in a separate tab
    const handleOpenReport = async (reportId, reportName) => {
        const isProfit = reportName && reportName.toLowerCase().includes('profit');
        const fileName = isProfit ? `${reportId}_Profit_Report.pdf` : `${reportId}_Sales_Report.pdf`;
        const reportUrl = `http://localhost:5000/api/report/${fileName}`;
        
        try {
            const response = await fetch(reportUrl, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                alert("Access Denied or File Not Found!");
                return;
            }

            const blob = await response.blob();
            const fileURL = URL.createObjectURL(blob);
            window.open(fileURL, '_blank');
        } catch (error) {
            console.error("Error opening report secure window:", error);
            alert("An error occurred while opening the report.");
        }
    };

    // Delete the report
    const handleDeleteReport = (reportId) => {
        if (window.confirm(`Are you sure you want to delete ${reportId}?`)) {
            fetch(`http://localhost:5000/api/delete-report/${reportId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            })
            .then(res => res.json())
            .then(data => {
                alert(data.message || "Report deleted successfully");
                fetchReports(); 
            })
            .catch(err => console.error("Error deleting report:", err));
        }
    };

    // Fetch invoice years
    const fetchInvoiceYears = () => {
        fetch('http://localhost:5000/api/get-invoice-years', {
            headers: getAuthHeaders()
        })
            .then(res => res.json())
            .then(years => {
                if (Array.isArray(years) && years.length > 0) {
                    setInvoiceYears(years);
                    setFromYear(years[0]);
                    setToYear(years[0]);
                }
            })
            .catch(err => console.error("Error fetching invoice years:", err));
    };

    useEffect(() => {
        fetchReports();
    }, []);

    // Reset the page to 1 when searching
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Function for generating sales/profit reports
    const handleCreateReport = () => {
        const monthMap = { Jan:'01', Feb:'02', Mar:'03', Apr:'04', May:'05', Jun:'06', Jul:'07', Aug:'08', Sep:'09', Oct:'10', Nov:'11', Dec:'12' };
        const formattedFromDate = `${fromYear}-${monthMap[fromMonth]}-${fromDate}`;
        const formattedToDate = `${toYear}-${monthMap[toMonth]}-${toDate}`;

        let apiUrl = 'http://localhost:5000/api/generate-sales-report';
        let fileName = `${nextReportID}_Sales_Report.pdf`;

        if (reportType === 'Profit Report') {
            apiUrl = 'http://localhost:5000/api/generate-profit-report';
            fileName = `${nextReportID}_Profit_Report.pdf`;
        }

        setIsGenerating(true);

        fetch(apiUrl, {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
                ReportID: nextReportID,
                ReportType: reportType,
                FromDate: formattedFromDate,
                ToDate: formattedToDate
            })
        })
        .then(res => {
            if (!res.ok) {
                return res.json().then(err => { throw new Error(err.error || "Failed to generate report") });
            }
            return res.blob();
        })
        .then(blob => {
            setTimeout(() => {
                setIsGenerating(false);

                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                a.remove();

                fetchReports();
                setIsAddReportOpen(false);
            }, 1000);
        })
        .catch(err => {
            setIsGenerating(false);
            console.error("Error creating report:", err);
            alert(err.message || "Something went wrong!");
        });
    };

    // Filtering & Pagination Logic
    const filteredReports = Array.isArray(reports) 
        ? reports.filter(rep =>
            rep.ReportID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rep.ReportName?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : [];

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredReports.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredReports.length / itemsPerPage);

    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    const handleOpenAddReport = () => {
        fetch('http://localhost:5000/api/next-report-id', {
            headers: getAuthHeaders()
        })
            .then(res => res.json())
            .then(data => {
                if (data.nextReportId) {
                    setNextReportID(data.nextReportId);
                }
            })
            .catch(err => console.error("Error fetching next report ID:", err));

        fetchReports();
        fetchInvoiceYears();
        setIsAddReportOpen(true);
    };

    return (
        <div className="main-layout" style={{ backgroundImage: `url(${bgImage})` }}>
            
            {/* FULL WINDOW DARK BLUR GENERATING REPORT LOADER */}
            {isGenerating && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    backgroundColor: 'rgba(0, 0, 0, 0.45)',
                    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                    zIndex: 999999
                }}>
                    <div className="modern-report-spinner"></div>
                    <div className="loader-report-text">
                        GENERATING REPORT...
                    </div>
                </div>
            )}

            <Sidebar />
            <div className="content-area">
                <Header />

                <div className="table-glass-container fadeInRight">
                    <div className="table-top-header">
                        <div className="title-section">
                            Reports <span className="plus-icon" onClick={handleOpenAddReport}>+</span>
                        </div>
                        <div className="search-container">
                            <input 
                                type="text" 
                                placeholder="Search Report ID or Name..." 
                                className="search-input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <button className="search-btn-modern">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                                    <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="report-table-wrapper">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>Report ID</th>
                                    <th>Report Name</th>
                                    <th>Date</th>
                                    <th>Time</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', color: '#999', padding: '30px' }}>
                                            No reports found
                                        </td>
                                    </tr>
                                ) : (
                                    currentItems.map((rep, index) => (
                                        <tr key={index}>
                                            <td style={{ fontWeight: 'bold' }}>{rep.ReportID}</td>
                                            <td>{rep.ReportName}</td>
                                            <td>{rep.Date}</td>
                                            <td>{rep.Time}</td>
                                            <td>
                                                <div className="action-buttons-wrapper">
                                                    <button 
                                                        className="report-open-btn" 
                                                        onClick={() => handleOpenReport(rep.ReportID, rep.ReportName)}
                                                    >
                                                        Open
                                                    </button>
                                                    <button 
                                                        className="report-delete-btn" 
                                                        onClick={() => handleDeleteReport(rep.ReportID)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 📄 Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="pagination-wrapper">
                            <button className="pagination-btn" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                                ◀ Prev
                            </button>
                            <div className="pagination-numbers">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                                    <button key={number} className={`page-number-btn ${currentPage === number ? 'active' : ''}`} onClick={() => handlePageChange(number)}>
                                        {number}
                                    </button>
                                ))}
                            </div>
                            <button className="pagination-btn" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                                Next ▶
                            </button>
                        </div>
                    )}
                </div>

                {/* Create Report Sidebar Overlay */}
                <div className={`add-product-overlay ${isAddReportOpen ? 'open' : ''}`} onClick={() => setIsAddReportOpen(false)}>
                    <div className="add-product-sidebar" onClick={(e) => e.stopPropagation()}>
                        <h2>Create Report</h2>
                        
                        <div className="form-group">
                            <label>Report ID</label>
                            <input type="text" className="form-input" value={nextReportID} readOnly style={{ background: 'rgba(255, 255, 255, 0.2)', cursor: 'not-allowed', fontWeight: 'bold' }} />
                        </div>

                        <div className="form-group">
                            <label>Report</label>
                            <select name="ReportType" className="form-input" value={reportType} onChange={(e) => setReportType(e.target.value)}>
                                <option value="Sales Report">Sales Report</option>
                                <option value="Profit Report">Profit Report</option>
                            </select>
                        </div>

                        <div className="report-time-range-wrapper">
                            <h3 className="time-range-title">Time range</h3>
                            
                            <div className="form-group">
                                <label style={{ fontSize: '0.85rem', opacity: 0.9 }}>From</label>
                                <div className="report-dropdown-row">
                                    <select value={fromYear} onChange={(e) => setFromYear(e.target.value)} className="form-input sub-select">
                                        {invoiceYears.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                    <select value={fromMonth} onChange={(e) => setFromMonth(e.target.value)} className="form-input sub-select">
                                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                    <select value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="form-input sub-select">
                                        {days.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label style={{ fontSize: '0.85rem', opacity: 0.9 }}>To</label>
                                <div className="report-dropdown-row">
                                    <select value={toYear} onChange={(e) => setToYear(e.target.value)} className="form-input sub-select">
                                        {invoiceYears.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                    <select value={toMonth} onChange={(e) => setToMonth(e.target.value)} className="form-input sub-select">
                                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                    <select value={toDate} onChange={(e) => setToDate(e.target.value)} className="form-input sub-select">
                                        {days.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="form-buttons">
                            <button className="add-btn" onClick={handleCreateReport} disabled={isGenerating}>Create</button>
                            <button className="cancel-btn" onClick={() => setIsAddReportOpen(false)} disabled={isGenerating}>Cancel</button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default Report;