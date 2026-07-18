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

    const [inputCash, setInputCash] = useState('');
    const [displayedCash, setDisplayedCash] = useState(0);
    const [balance, setBalance] = useState(0);

    const [allProducts, setAllProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);

    // 💡 අලුතින් එකතු කළ States
    const [isBulk, setIsBulk] = useState(false); 
    const [weightUnit, setWeightUnit] = useState('Kg'); 

    const fetchStats = () => {
        fetch('http://localhost:5000/api/billing-stats')
            .then(res => res.json())
            .then(data => setStats(data))
            .catch(err => console.error("Error fetching stats:", err));
    };

    const loadAllProductsForBilling = () => {
        fetch('http://localhost:5000/api/search-billing-products?q=')
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
                fetch(`http://localhost:5000/api/get-product-by-barcode/${barcode}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            setItem(data.item);
                            setPrice(data.price);
                            setPurchasePrice(data.purchasePrice || 0); 
                            setQty(1);

                            // බාර්කෝඩ් එකෙන් සෙවීමේදී Bulk product එකක්දැයි හඳුනාගැනීම
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
        setBarcode(product.Barcode || product.ID || '');
        
        // Bulk Product එකක් නම් Default 1Kg ලෙස සැකසීම
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

        // ග්‍රෑම් (g) තෝරා ඇත්නම් එය ඩේටාබේස් එක සඳහා කිලෝග්‍රෑම් (0.250) බවට පත් කිරීම
        if (isBulk && weightUnit === 'g') {
            finalQtyForDB = parseFloat(qty) / 1000;
        }

        const newItem = {
            barcode: barcode, 
            item: item,
            qty: finalQtyForDB, 
            displayQty: displayQty, 
            price: parseFloat(price) || 0,
            purchasePrice: parseFloat(purchasePrice) || 0, 
            total: finalQtyForDB * (parseFloat(price) || 0)
        };

        setBillItems([...billItems, newItem]);
        setBarcode('');
        setItem('');
        setPrice('');
        setQty(1);
        setPurchasePrice(0);
        setIsBulk(false); 
    };

    const total = billItems.reduce((acc, curr) => acc + curr.total, 0);

    const generatePDF = async (invoiceData, items) => {
        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("Dumbara Supermarket", 105, 20, { align: "center" });
        doc.setFontSize(10);
        doc.text("****************************************************", 105, 25, { align: "center" });
        
        doc.setFontSize(16);
        doc.text("INVOICE", 105, 35, { align: "center" });

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Dumbara Supermarket", 15, 45);
        doc.text("NO 113, Madiwaka Rd, Ududumbara", 15, 50);
        doc.text("dumbarasupermarket@gmail.com | 0707395519", 15, 55);
        doc.text(`Date : ${invoiceData.Date}`, 15, 60);
        doc.text(`Time : ${invoiceData.Time}`, 15, 65);
        doc.text(`Invoice No : ${invoiceData.InvoiceID}`, 15, 75);

        const tableColumn = ["Name", "Unit Price", "Qty", "Total"];
        const tableRows = items.map(item => [
            item.item,
            `Rs ${item.price.toFixed(2)}`,
            item.displayQty, 
            `Rs ${item.total.toFixed(2)}`
        ]);

        autoTable(doc, {
            startY: 80,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.1 },
            styles: { textColor: [0, 0, 0], lineWidth: 0.1 }
        });

        const finalY = doc.lastAutoTable.finalY + 10;
        doc.text(`Total : Rs ${invoiceData.Total.toFixed(2)}`, 15, finalY);
        doc.text(`Cash : Rs ${invoiceData.Cash.toFixed(2)}`, 15, finalY + 7);
        doc.text(`Balance : Rs ${invoiceData.Balance.toFixed(2)}`, 15, finalY + 14);

        doc.setFont("helvetica", "italic");
        doc.text("Thank you for your purchase!", 105, finalY + 30, { align: "center" });
        doc.text("Please come again!", 105, finalY + 37, { align: "center" });

        const pdfDataUri = doc.output('datauristring');
        const pdfBase64 = pdfDataUri.split(',')[1]; 
        const fileName = `${invoiceData.InvoiceID}.pdf`;

        try {
            const response = await fetch('http://localhost:5000/api/save-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pdfData: pdfBase64, fileName: fileName })
            });
            const result = await response.json();
            if (result.success) console.log("PDF successfully saved!");
        } catch (error) {
            console.error("Error saving PDF:", error);
        }
        doc.save(fileName); 
    };

    const handlePay = () => {
        const cashAmount = parseFloat(inputCash);
        if (billItems.length === 0 || isNaN(cashAmount) || cashAmount <= 0 || cashAmount < total) {
            alert("Invalid checkout details!");
            return;
        }

        const totalQty = billItems.length;
        const totalProfit = billItems.reduce((acc, curr) => {
            return acc + (((parseFloat(curr.price) || 0) - (parseFloat(curr.purchasePrice) || 0)) * (parseFloat(curr.qty) || 0));
        }, 0);

        const today = new Date();
        const currentDate = today.toLocaleDateString('en-CA'); 
        const currentTime = today.toLocaleTimeString('en-GB', { hour12: false }); 

        const productListString = billItems.map(item => item.barcode).join(','); 
        const productNameListString = billItems.map(item => item.item).join(','); 
        const countListString = billItems.map(item => item.qty).join(',');

        fetch('http://localhost:5000/api/next-invoice-id')
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
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(invoicePayload)
                })
                .then(res => res.json())
                .then(saveData => {
                    if (saveData.success) {
                        generatePDF({ 
                            InvoiceID: nextInvId, 
                            Date: currentDate, 
                            Time: currentTime, 
                            Total: total, 
                            Cash: cashAmount, 
                            Balance: cashAmount - total 
                        }, billItems);

                        alert("Payment Successful and Invoice Details Saved!");
                        setBillItems([]); 
                        setInputCash(''); 
                        fetchStats();
                    } else {
                        alert("Failed to save invoice to database: " + saveData.message);
                    }
                });
            })
            .catch(err => {
                console.error("Error during checkout:", err);
                alert("An error occurred during payment processing.");
            });
    };

    return (
        <div className="billing-layout" style={{ backgroundImage: `url(${bgImage})` }}>
            <Sidebar />
            <div className="billing-content">
                <Header />

                {/* Stats Section */}
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

                {/* Grid Layout */}
                <div className="billing-main-grid fadeInRight">
                    <div className="billing-form-section glass-effect">
                        <div className="bill-form-group">
                            <input type="text" placeholder="Bar Code" className="billing-input-field" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
                        </div>
                        
                        <div className="bill-form-group" style={{ position: 'relative' }}>
                            <input 
                                type="text" 
                                placeholder="Select or Type Item" 
                                className="billing-input-field" 
                                value={item} 
                                onChange={handleInputChange} 
                                onFocus={() => setShowDropdown(true)}
                                onBlur={() => setTimeout(() => setShowDropdown(false), 200)} 
                                autoComplete="off"
                            />
                            
                            {showDropdown && filteredProducts.length > 0 && (
                                <ul className="billing-custom-dropdown">
                                    {filteredProducts.map((p, index) => (
                                        <li 
                                            key={index} 
                                            onClick={() => handleSelectProduct(p)}
                                            className="dropdown-item-row"
                                        >
                                            <span className="prod-name-span">{p.Name}</span>
                                            <span className="prod-price-span">Rs.{p.Sell_Price ? Number(p.Sell_Price).toFixed(2) : '0.00'}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Qty Input සහ Kg/g Dropdown කොටස */}
                        <div className="bill-form-group billing-qty-container">
    <input 
        type="number" 
        placeholder="Qty" 
        className="billing-input-field" 
        value={qty} 
        onChange={(e) => setQty(e.target.value)} 
        min="0.001" 
        step="any" 
    />
    
    {isBulk && (
        <select 
            value={weightUnit} 
            onChange={(e) => setWeightUnit(e.target.value)}
            className="billing-unit-select"
        >
            <option value="Kg">Kg</option>
            <option value="g">g</option>
        </select>
    )}
</div>

                        <div className="bill-form-group">
                            <input type="number" placeholder="Price" className="billing-input-field" value={price} onChange={(e) => setPrice(e.target.value)} />
                        </div>
                        
                        <button className="billing-add-item-btn" onClick={handleAddItem}>Add Item</button>

                        <div className="billing-payment-box">
                            <input type="number" placeholder="Cash" className="billing-input-field cash-highlight" value={inputCash} onChange={(e) => setInputCash(e.target.value)} />
                            <button className="billing-pay-btn" onClick={handlePay}>Pay</button>
                        </div>
                    </div>

                    <div className="billing-table-section glass-effect">
                        <h3 className="table-title">Item List</h3>
                        <div className="bill-table-wrapper">
                            <table className="billing-modern-table">
                                <thead>
                                    <tr>
                                        <th>Item</th><th>Qty</th><th>Price</th><th>Total</th><th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {billItems.length === 0 ? (
                                        <tr><td colSpan="5" style={{ textAlign: 'center', color: '#999' }}>No items added yet.</td></tr>
                                    ) : (
                                        billItems.map((bi, index) => (
                                            <tr key={index}>
                                                <td>{bi.item}</td>
                                                <td>{bi.displayQty || bi.qty}</td> 
                                                <td>{bi.price.toFixed(2)}</td>
                                                <td>{bi.total.toFixed(2)}</td>
                                                <td><button className="delete-btn-small" onClick={() => setBillItems(billItems.filter((_, i) => i !== index))}>Remove</button></td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="billing-summary-panel">
                            <div className="summary-item">Total : <span className="summary-val">Rs. {total.toFixed(2)}</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Billing;