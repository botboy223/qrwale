function domReady(fn) {
    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(fn, 1);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

function saveToLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function loadFromLocalStorage(key) {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
}

function switchToOption1() {
    document.getElementById('option1').style.display = 'block';
    document.getElementById('option2').style.display = 'none';
    document.getElementById('option3').style.display = 'none';
    document.getElementById('option4').style.display = 'none';
    document.getElementById('option5').style.display = 'none';
    document.getElementById('option6').style.display = 'none';
}

function switchToOption2() {
    document.getElementById('option1').style.display = 'none';
    document.getElementById('option2').style.display = 'block';
    document.getElementById('option3').style.display = 'none';
    document.getElementById('option4').style.display = 'none';
    document.getElementById('option5').style.display = 'none';
    document.getElementById('option6').style.display = 'none';
}

function switchToOption3() {
    document.getElementById('option1').style.display = 'none';
    document.getElementById('option2').style.display = 'none';
    document.getElementById('option3').style.display = 'block';
    document.getElementById('option4').style.display = 'none';
    document.getElementById('option5').style.display = 'none';
    document.getElementById('option6').style.display = 'none';
}

function switchToOption4() {
    document.getElementById('option1').style.display = 'none';
    document.getElementById('option2').style.display = 'none';
    document.getElementById('option3').style.display = 'none';
    document.getElementById('option4').style.display = 'block';
    document.getElementById('option5').style.display = 'none';
    document.getElementById('option6').style.display = 'none';
}

function switchToOption5() {
    document.getElementById('option1').style.display = 'none';
    document.getElementById('option2').style.display = 'none';
    document.getElementById('option3').style.display = 'none';
    document.getElementById('option4').style.display = 'none';
    document.getElementById('option5').style.display = 'block';
    document.getElementById('option6').style.display = 'none';
    displayBillHistory();
}

function switchToOption6() {
    document.getElementById('option1').style.display = 'none';
    document.getElementById('option2').style.display = 'none';
    document.getElementById('option3').style.display = 'none';
    document.getElementById('option4').style.display = 'none';
    document.getElementById('option5').style.display = 'none';
    document.getElementById('option6').style.display = 'block';
    displayInventory();
}

domReady(function () {
    let productDetails = loadFromLocalStorage('productDetails') || {};
    let cart = [];
    let upiDetails = loadFromLocalStorage('upiDetails') || {};
    let billHistory = loadFromLocalStorage('billHistory') || [];

    function onScanSuccessOption1(decodeText, decodeResult) {
        document.getElementById('barcode').value = decodeText;
        if (productDetails[decodeText]) {
            document.getElementById('product-name').value = productDetails[decodeText].name;
            document.getElementById('product-price').value = productDetails[decodeText].price;
        } else {
            document.getElementById('product-name').value = '';
            document.getElementById('product-price').value = '';
        }
    }

    function onScanSuccessOption2(decodeText, decodeResult) {
        if (productDetails[decodeText]) {
            const product = productDetails[decodeText];
            const item = cart.find(item => item.code === decodeText);

            if (item) {
                item.quantity += 1;
            } else {
                cart.push({ code: decodeText, quantity: 1 });
            }

            displayCart();
        } else {
            alert("Unknown product: " + decodeText);
        }
    }

    function displayCart() {
        const cartDiv = document.getElementById('cart');
        cartDiv.innerHTML = '';

        cart.forEach((item, index) => {
            const product = productDetails[item.code];
            const itemDiv = document.createElement('div');
            itemDiv.innerHTML = `
                ${item.code} - ₹${product.price} - ${product.name} 
                Quantity: <input type="number" value="${item.quantity}" min="1" data-index="${index}">
            `;
            cartDiv.appendChild(itemDiv);
        });

        calculateTotal();
    }

    function calculateTotal() {
        let total = 0;

        cart.forEach(item => {
            const product = productDetails[item.code];
            total += product.price * item.quantity;
        });

        document.getElementById('total').innerText = `Total: ₹${total}`;
    }

    document.getElementById('cart').addEventListener('input', (event) => {
        const input = event.target;
        const index = input.dataset.index;
        const newQuantity = parseInt(input.value, 10);

        if (!isNaN(newQuantity) && newQuantity > 0) {
            cart[index].quantity = newQuantity;
            calculateTotal();
        }
    });

    document.getElementById('save-barcode').addEventListener('click', () => {
        const barcode = document.getElementById('barcode').value;
        const productName = document.getElementById('product-name').value;
        const productPrice = parseFloat(document.getElementById('product-price').value);

        if (barcode && productName && !isNaN(productPrice)) {
            productDetails[barcode] = { name: productName, price: productPrice };
            saveToLocalStorage('productDetails', productDetails);
            alert('Product details saved.');
        } else {
            alert('Please fill in all fields.');
        }
    });

    document.getElementById('generate-bill').addEventListener('click', () => {
        const totalAmount = document.getElementById('total').innerText.split('₹')[1];
        const date = new Date().toLocaleString();
        const billId = `BILL-${Date.now()}`;

        if (!upiDetails.upiId || !upiDetails.name || !upiDetails.note) {
            alert('Please set up your UPI details in the UPI QR Code section first.');
            return;
        }

        const upiUrl = `upi://pay?pa=${upiDetails.upiId}&pn=${upiDetails.name}&am=${totalAmount}&cu=INR&tn=${upiDetails.note}`;

        const qrCode = new QRCodeStyling({
            width: 300,
            height: 300,
            data: upiUrl,
            dotsOptions: {
                color: "#000",
                type: "rounded"
            },
            backgroundOptions: {
                color: "#fff",
            }
        });

        document.getElementById('bill-qr-code').innerHTML = "";
        qrCode.append(document.getElementById('bill-qr-code'));

        const qrCodeDiv = document.createElement('div');
        qrCode.append(qrCodeDiv);

        billHistory.push({
            id: billId,
            date: date,
            total: totalAmount,
            qrCode: qrCodeDiv.innerHTML
        });

        saveToLocalStorage('billHistory', billHistory);
        displayBillHistory();
        alert('Total Bill: ₹' + totalAmount);
    });

    document.getElementById('qrForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const upiId = document.getElementById('upi_id').value;
        const name = document.getElementById('name').value;
        const note = document.getElementById('note').value;

        upiDetails = { upiId, name, note };
        saveToLocalStorage('upiDetails', upiDetails);

        alert('UPI details saved.');
    });

    document.getElementById('download-data').addEventListener('click', () => {
        const data = {
            productDetails,
            cart,
            upiDetails,
            billHistory
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    document.getElementById('upload-data').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const data = JSON.parse(e.target.result);
                productDetails = data.productDetails || {};
                cart = data.cart || [];
                upiDetails = data.upiDetails || {};
                billHistory = data.billHistory || {};

                saveToLocalStorage('productDetails', productDetails);
                saveToLocalStorage('cart', cart);
                saveToLocalStorage('upiDetails', upiDetails);
                saveToLocalStorage('billHistory', billHistory);

                alert('Data imported successfully.');
            };
            reader.readAsText(file);
        }
    });

    function displayBillHistory() {
        const billHistoryDiv = document.getElementById('bill-history');
        billHistoryDiv.innerHTML = '';

        billHistory.forEach(bill => {
            const billDiv = document.createElement('div');
            billDiv.innerHTML = `
                <p><strong>ID:</strong> ${bill.id}</p>
                <p><strong>Date:</strong> ${bill.date}</p>
                <p><strong>Total:</strong> ₹${bill.total}</p>
                <div>${bill.qrCode}</div>
                <hr>
            `;
            billHistoryDiv.appendChild(billDiv);
        });
    }

    function displayInventory() {
        const inventoryDiv = document.getElementById('inventory-list');
        inventoryDiv.innerHTML = '';

        Object.keys(productDetails).forEach(barcode => {
            const product = productDetails[barcode];
            const itemDiv = document.createElement('div');
            itemDiv.innerHTML = `${barcode} - ${product.name} - ₹${product.price}`;
            inventoryDiv.appendChild(itemDiv);
        });
    }

    // Initialize QR Code Readers
    const qrCodeReaderOption1 = new Html5QrcodeScanner("my-qr-reader-option1", { fps: 10, qrbox: 250 });
    qrCodeReaderOption1.render(onScanSuccessOption1);

    const qrCodeReaderOption2 = new Html5QrcodeScanner("my-qr-reader-option2", { fps: 10, qrbox: 250 });
    qrCodeReaderOption2.render(onScanSuccessOption2);
});
