import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import './Billing.css';
import bgImage from './assets/abc.avif';
import jsPDF from 'jspdf'; 
import autoTable from 'jspdf-autotable'; 
import Header from './Header';

function Billing() {
    const [billItems, setBillItems] = useState([]);
    const [stats, setStats] = useState({ lastTransaction: 0, todayCount: 0 });
    
    const [barcode, setBarcode] = useState('');
    const [item, setItem] = useState('');
    const [qty, setQty] = useState(1);
    const [price, setPrice] = useState('');
    const [purchasePrice, setPurchasePrice] = useState(0); 
    const [discountPercent, setDiscountPercent] = useState(0); 

    const [inputCash, setInputCash] = useState('');
    const [displayedCash, setDisplayedCash] = useState(0);
    const [balance, setBalance] = useState(0);

    const [allProducts, setAllProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);

    const [isBulk, setIsBulk] = useState(false); 
    const [weightUnit, setWeightUnit] = useState('Kg'); 

    const [isPayLoading, setIsPayLoading] = useState(false);

    const getAuthHeaders = (extraHeaders = {}) => {
        const username = sessionStorage.getItem('userName') || localStorage.getItem('userName') || '';
        return { 'x-user-name': username, ...extraHeaders };
    };

    const fetchStats = () => {
        fetch('http://localhost:5000/api/billing-stats', { headers: getAuthHeaders() })
            .then(res => res.json())
            .then(data => setStats(data))
            .catch(err => console.error("Error fetching stats:", err));
    };

    const loadAllProductsForBilling = () => {
        fetch('http://localhost:5000/api/search-billing-products?q=', { headers: getAuthHeaders() })
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    setAllProducts(res.data || []);
                    setFilteredProducts(res.data || []);
                }
            })
            .catch(err => console.error("Error loading products for billing:", err));
    };

    useEffect(() => {
        fetchStats();
        loadAllProductsForBilling(); 
    }, []);

    useEffect(() => {
        if (barcode.trim().length > 0) {
            const delayDebounceFn = setTimeout(() => {
                fetch(`http://localhost:5000/api/get-product-by-barcode/${barcode}`, { headers: getAuthHeaders() })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            setItem(data.item);
                            setPrice(data.price);
                            setPurchasePrice(data.purchasePrice || 0); 
                            setDiscountPercent(data.discount || 0); 
                            setQty(1);

                            const matchedProduct = allProducts.find(p => p.Barcode === barcode);
                            if (matchedProduct && (matchedProduct.Type === 'Bulk' || (matchedProduct.ID && matchedProduct.ID.startsWith('B')))) {
                                setIsBulk(true);
                                setWeightUnit('Kg');
                            } else {
                                setIsBulk(false);
                            }
                        } else {
                            setItem('');
                            setPrice('');
                            setPurchasePrice(0);
                            setDiscountPercent(0);
                            setIsBulk(false);
                        }
                    })
                    .catch(err => console.error(err));
            }, 300);

            return () => clearTimeout(delayDebounceFn);
        }
    }, [barcode, allProducts]);

    const handleInputChange = (e) => {
        const value = e.target.value;
        setItem(value);
        setShowDropdown(true);

        if (!value.trim()) {
            setFilteredProducts(allProducts);
        } else {
            const filtered = allProducts.filter(p => 
                p.Name && p.Name.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredProducts(filtered);
        }
    };

    const handleSelectProduct = (product) => {
        setItem(product.Name); 
        setPrice(product.Sell_Price || 0);
        setPurchasePrice(product.Purchase_Price || 0);
        setDiscountPercent(product.Discount || 0); 
        setBarcode(product.Barcode || product.ID || '');
        
        if (product.Type === 'Bulk' || (product.ID && product.ID.startsWith('B'))) {
            setIsBulk(true);
            setWeightUnit('Kg');
            setQty(1); 
        } else {
            setIsBulk(false);
            setQty(1); 
        }
        setShowDropdown(false); 
    };

    const handleAddItem = () => {
        if (!item || !price || qty <= 0) {
            alert("Please enter valid item details!");
            return;
        }

        let finalQtyForDB = parseFloat(qty) || 1; 
        let displayQty = qty + (isBulk ? ` ${weightUnit}` : ''); 

        if (isBulk && weightUnit === 'g') {
            finalQtyForDB = parseFloat(qty) / 1000;
        }

        // 🟢 FIXED: Exact Product Match with full support for 'Name' and 'Product_name'
        const matchedProd = allProducts.find(p => {
            const pName = (p.Name || p.Product_name || '').toString().trim().toLowerCase();
            const currentItemName = item.toString().trim().toLowerCase();
            const nameMatch = pName === currentItemName;
            
            const pBarcode = (p.Barcode || p.ID || '').toString().trim();
            const currentBarcode = (barcode || '').toString().trim();
            const barcodeMatch = currentBarcode && pBarcode === currentBarcode;

            if (item && barcode) {
                return nameMatch && barcodeMatch;
            }
            return nameMatch || barcodeMatch;
        });

        // 🟢 FIXED: Get correct stock quantity from retrieved DB items
        const availableStock = matchedProd 
            ? parseFloat(matchedProd.Quantity ?? matchedProd.quantity ?? 0) 
            : 0;

        // Stock Validation
        if (matchedProd && finalQtyForDB > availableStock) {
            alert(`Insufficient stock! Only ${availableStock} ${isBulk ? 'Kg' : 'units'} available.`);
            return;
        }

        // Discount Calculations
        const originalPrice = parseFloat(price) || 0;
        const discPercent = parseFloat(discountPercent) || 0;
        const discountAmount = originalPrice * (discPercent / 100);
        const finalDiscountedPrice = originalPrice - discountAmount;

        const newItem = {
            barcode: barcode, 
            item: item,
            qty: finalQtyForDB, 
            displayQty: displayQty, 
            originalPrice: originalPrice,
            discountPercent: discPercent,
            discountAmount: discountAmount,
            price: finalDiscountedPrice,
            purchasePrice: parseFloat(purchasePrice) || 0, 
            total: finalQtyForDB * finalDiscountedPrice
        };

        setBillItems([...billItems, newItem]);
        
        // Reset form
        setBarcode('');
        setItem('');
        setPrice('');
        setQty(1);
        setPurchasePrice(0);
        setDiscountPercent(0);
        setIsBulk(false); 
    };

    
    const total = billItems.reduce((acc, curr) => acc + curr.total, 0);
    const totalSavings = billItems.reduce((acc, curr) => acc + (curr.discountAmount * curr.qty), 0);

    const generatePDF = async (invoiceData, items) => {
        // Calculate dynamic height in mm based on items count
        const baseHeight = 120; // Base height for header, summary, and footer
        const itemHeight = items.length * 10; 
        const calculatedHeight = baseHeight + itemHeight;

        // Setup jsPDF with 80mm POS thermal paper width
        const doc = new jsPDF({
            unit: 'mm',
            format: [80, calculatedHeight]
        });

        // Receipt Header Section
        doc.setFont("courier", "bold");
        doc.setFontSize(12);
        doc.text("DUMBARA SUPERMARKET", 40, 10, { align: "center" });

        doc.setFont("courier", "normal");
        doc.setFontSize(8);
        doc.text("No 113, Madiwaka Rd, Ududumbara", 40, 15, { align: "center" });
        doc.text("Tel: 0707395519", 40, 19, { align: "center" });
        doc.text("------------------------------------------", 40, 23, { align: "center" });

        doc.setFontSize(8);
        doc.text(`INV NO: ${invoiceData.InvoiceID}`, 5, 28);
        doc.text(`DATE  : ${invoiceData.Date}`, 5, 32);
        doc.text(`TIME  : ${invoiceData.Time}`, 5, 36);
        doc.text("------------------------------------------", 40, 40, { align: "center" });

        // Prepare table data with item-level discount display
        const tableColumn = ["Item", "Qty", "Price", "Total"];
        const tableRows = items.map(item => {
            let itemNameDisplay = item.item;
            
            // Append discount info under the item name if applicable
            if (item.discountPercent && item.discountPercent > 0) {
                itemNameDisplay += `\n (Disc: ${item.discountPercent}%)`;
            } else if (item.discountAmount && item.discountAmount > 0) {
                itemNameDisplay += `\n (Disc: -${item.discountAmount.toFixed(2)})`;
            }

            return [
                itemNameDisplay,
                item.displayQty, 
                `${item.originalPrice.toFixed(2)}`,
                `${item.total.toFixed(2)}`
            ];
        });

        // Render table using autoTable
        autoTable(doc, {
            startY: 42,
            head: [tableColumn],
            body: tableRows,
            theme: 'plain',
            styles: {
                font: 'courier',
                fontSize: 7.5,
                cellPadding: 1,
                overflow: 'linebreak'
            },
            headStyles: {
                fontStyle: 'bold',
                fillColor: [255, 255, 255],
                textColor: [0, 0, 0]
            },
            columnStyles: {
                0: { cellWidth: 28 }, // Item Name + Discount info
                1: { cellWidth: 12, halign: 'center' }, // Quantity
                2: { cellWidth: 15, halign: 'right' },  // Unit Price
                3: { cellWidth: 18, halign: 'right' }   // Total Price
            },
            margin: { left: 3, right: 3 }
        });

        // Summary / Totals Section
        let finalY = doc.lastAutoTable.finalY + 3;

        doc.text("------------------------------------------", 40, finalY, { align: "center" });
        finalY += 4;

        doc.setFontSize(8);
        doc.setFont("courier", "normal");

        if (invoiceData.TotalSavings > 0) {
            doc.text(`Sub Total    : Rs ${ (invoiceData.Total + invoiceData.TotalSavings).toFixed(2) }`, 5, finalY);
            finalY += 4;
            doc.text(`Discount     : Rs ${ invoiceData.TotalSavings.toFixed(2) }`, 5, finalY);
            finalY += 4;
        }

        doc.setFont("courier", "bold");
        doc.text(`NET TOTAL    : Rs ${ invoiceData.Total.toFixed(2) }`, 5, finalY);
        finalY += 4;

        doc.setFont("courier", "normal");
        doc.text(`CASH         : Rs ${ invoiceData.Cash.toFixed(2) }`, 5, finalY);
        finalY += 4;
        doc.text(`BALANCE      : Rs ${ invoiceData.Balance.toFixed(2) }`, 5, finalY);
        finalY += 5;

        // Receipt Footer Section
        doc.text("------------------------------------------", 40, finalY, { align: "center" });
        finalY += 4;
        doc.setFont("courier", "bold");
        doc.setFontSize(8);
        doc.text("THANK YOU FOR YOUR PURCHASE!", 40, finalY, { align: "center" });
        finalY += 4;
        doc.setFont("courier", "normal");
        doc.text("PLEASE COME AGAIN", 40, finalY, { align: "center" });

        // Convert PDF to Base64 and save to server
        const pdfDataUri = doc.output('datauristring');
        const pdfBase64 = pdfDataUri.split(',')[1]; 
        const fileName = `${invoiceData.InvoiceID}.pdf`;

        try {
            const response = await fetch('http://localhost:5000/api/save-pdf', {
                method: 'POST',
                headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ pdfData: pdfBase64, fileName: fileName })
            });
            const result = await response.json();
            if (result.success) console.log("80mm Receipt PDF successfully saved!");
        } catch (error) {
            console.error("Error saving PDF:", error);
        }

        // Trigger PDF Download
        doc.save(fileName); 
    };

    const handlePay = () => {
        const cashAmount = parseFloat(inputCash);
        if (billItems.length === 0 || isNaN(cashAmount) || cashAmount <= 0 || cashAmount < total) {
            alert("Invalid checkout details!");
            return;
        }

        setIsPayLoading(true);

        const totalQty = billItems.length;
        
        // 🟢 Calculate the actual profit (subtract the purchase price from the discounted price, curr.price)
        const totalProfit = billItems.reduce((acc, curr) => {
            return acc + ((curr.price - curr.purchasePrice) * curr.qty);
        }, 0);

        const today = new Date();
        const currentDate = today.toLocaleDateString('en-CA'); 
        const currentTime = today.toLocaleTimeString('en-GB', { hour12: false }); 

        const productListString = billItems.map(item => item.barcode).join(','); 
        const productNameListString = billItems.map(item => item.item).join(','); 
        const countListString = billItems.map(item => item.qty).join(',');

        fetch('http://localhost:5000/api/next-invoice-id', { headers: getAuthHeaders() })
            .then(res => res.json())
            .then(idData => {
                const nextInvId = idData.nextInvoiceId || 'INV1';
                
                const invoicePayload = {
                    InvoiceID: nextInvId, 
                    Product_Qty: totalQty, 
                    Total: total, 
                    Profit: totalProfit, 
                    Date: currentDate, 
                    Time: currentTime,
                    ProductList: productListString,         
                    ProductNameList: productNameListString, 
                    CountList: countListString              
                };

                return fetch('http://localhost:5000/api/add-invoice', {
                    method: 'POST',
                    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify(invoicePayload)
                })
                .then(res => res.json())
                .then(saveData => {
                    setTimeout(() => {
                        setIsPayLoading(false);

                        if (saveData.success) {
                            generatePDF({ 
                                InvoiceID: nextInvId, 
                                Date: currentDate, 
                                Time: currentTime, 
                                Total: total,
                                TotalSavings: totalSavings, 
                                Cash: cashAmount, 
                                Balance: cashAmount - total 
                            }, billItems);

                            setBillItems([]); 
                            setInputCash(''); 
                            fetchStats();
                        } else {
                            alert("Failed to save invoice to database: " + saveData.message);
                        }
                    }, 800);
                });
            })
            .catch(err => {
                setIsPayLoading(false); 
                console.error("Error during checkout:", err);
                alert("An error occurred during payment processing.");
            });
    };

    return (
        <div className="billing-layout" style={{ backgroundImage: `url(${bgImage})` }}>
            
            {isPayLoading && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    backgroundColor: 'rgba(46, 204, 113, 0.15)', 
                    backdropFilter: 'blur(15px)', WebkitBackdropFilter: 'blur(15px)', 
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                    zIndex: 999999 
                }}>
                    <div className="modern-login-spinner" style={{ borderColor: 'rgba(46, 204, 113, 0.2)', borderTopColor: '#2ecc71', width: '55px', height: '55px' }}></div>
                    <div className="loader-login-text" style={{ color: '#1abc9c', fontWeight: 'bold', marginTop: '20px', letterSpacing: '2px', fontSize: '15px' }}>
                        PROCESSING TRANSACTION...
                    </div>
                </div>
            )}

            <Sidebar />
            <div className="billing-content">
                <Header />
                <div className="billing-stats-container">
                    <div className="billing-glass-card">
                        <h3 className="card-title">Last Transaction</h3>
                        <div className="stat-number">
                            {stats.lastTransaction ? Number(stats.lastTransaction).toFixed(2) : "0.00"}
                        </div> 
                    </div>
                    <div className="billing-glass-card">
                        <h3 className="card-title">Today Transactions</h3>
                        <div className="stat-number">
                            {stats.todayCount || 0}
                        </div> 
                    </div>
                </div>

                <div className="billing-main-grid fadeInRight">
                    <div className="billing-form-section glass-effect">
                        <div className="bill-form-group">
                            <input type="text" placeholder="Bar Code" className="billing-input-field" value={barcode} onChange={(e) => setBarcode(e.target.value)} disabled={isPayLoading} />
                        </div>
                        
                        <div className="bill-form-group" style={{ position: 'relative' }}>
                            <input 
                                type="text" 
                                placeholder="Select or Type Item" 
                                className="billing-input-field" 
                                value={item} 
                                onChange={handleInputChange} 
                                onFocus={() => !isPayLoading && setShowDropdown(true)}
                                onBlur={() => setTimeout(() => setShowDropdown(false), 200)} 
                                autoComplete="off"
                                disabled={isPayLoading}
                            />
                            
                            {showDropdown && filteredProducts.length > 0 && (
                                <ul className="billing-custom-dropdown">
                                    {filteredProducts.map((p, index) => (
                                        <li key={index} onClick={() => handleSelectProduct(p)} className="dropdown-item-row">
                                            <span className="prod-name-span">{p.Name}</span>
                                           
                                            <span className="prod-price-span">
                                                {p.Discount > 0 ? <span style={{color: '#f39c12', marginRight: '5px'}}>(-{p.Discount}%)</span> : null}
                                                Rs.{p.Sell_Price ? Number(p.Sell_Price).toFixed(2) : '0.00'}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="bill-form-group billing-qty-container">
                            <input type="number" placeholder="Qty" className="billing-input-field" value={qty} onChange={(e) => setQty(e.target.value)} min="0.001" step="any" disabled={isPayLoading} />
                            {isBulk && (
                                <select value={weightUnit} onChange={(e) => setWeightUnit(e.target.value)} className="billing-unit-select" disabled={isPayLoading}>
                                    <option value="Kg">Kg</option>
                                    <option value="g">g</option>
                                </select>
                            )}
                        </div>

                        <div className="bill-form-group">
                            <input type="number" placeholder="Price" className="billing-input-field" value={price} onChange={(e) => setPrice(e.target.value)} disabled={isPayLoading} />
                        </div>
                        
                        <button className="billing-add-item-btn" onClick={handleAddItem} disabled={isPayLoading}>Add Item</button>

                        <div className="billing-payment-box">
                            <input type="number" placeholder="Cash" className="billing-input-field cash-highlight" value={inputCash} onChange={(e) => setInputCash(e.target.value)} disabled={isPayLoading} />
                            <button className="billing-pay-btn" onClick={handlePay} disabled={isPayLoading}>Pay</button>
                        </div>
                    </div>

                    <div className="billing-table-section glass-effect">
                        <h3 className="table-title">Item List</h3>
                        <div className="bill-table-wrapper">
                            <table className="billing-modern-table">
                                <thead>
                                    <tr>
                                        <th>Item</th><th>Qty</th><th>Price</th><th>Disc(%)</th><th>Total</th><th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {billItems.length === 0 ? (
                                        <tr><td colSpan="6" style={{ textAlign: 'center', color: '#999' }}>No items added yet.</td></tr>
                                    ) : (
                                        billItems.map((bi, index) => (
                                            <tr key={index}>
                                                <td>{bi.item}</td>
                                                <td>{bi.displayQty || bi.qty}</td> 
                                                <td>{bi.originalPrice.toFixed(2)}</td>
                                                
                                                <td><b style={{ color: '#27ae60' }}>{bi.discountPercent > 0 ? `${bi.discountPercent.toFixed(1)}%` : '-'}</b></td>
                                                <td>{bi.total.toFixed(2)}</td>
                                                <td><button className="delete-btn-small" onClick={() => setBillItems(billItems.filter((_, i) => i !== index))} disabled={isPayLoading}>Remove</button></td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="billing-summary-panel" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>

                            {totalSavings > 0 && (
                                <div className="summary-item" style={{ color: '#f39c12', fontSize: '14px' }}>
                                    Total Savings : <span className="summary-val">Rs. {totalSavings.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="summary-item">Total : <span className="summary-val">Rs. {total.toFixed(2)}</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Billing;