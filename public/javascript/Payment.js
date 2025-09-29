document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const onlineForm = document.getElementById('onlinePaymentForm');
    const cashConfirmBtn = document.getElementById('confirmCashBtn');
    const paymentMessage = document.getElementById('paymentMessage');

    function switchTab(selectedTabId) {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        const selectedButton = document.querySelector(`.tab-btn[data-tab="${selectedTabId}"]`);
        const selectedContent = document.getElementById(selectedTabId);
        
        if (selectedButton && selectedContent) {
            selectedButton.classList.add('active');
            selectedContent.classList.add('active');
        }
        
        paymentMessage.style.display = 'none';
        paymentMessage.textContent = '';
    }

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    function showMessage(message, isSuccess) {
        paymentMessage.textContent = message;
        paymentMessage.style.display = 'block';
        paymentMessage.style.backgroundColor = isSuccess ? '#e6ffe6' : '#fff0f0';
        paymentMessage.style.color = isSuccess ? '#45613b' : '#cc0000';
        
        setTimeout(() => {
            paymentMessage.style.display = 'none';
        }, 5000);
    }

    onlineForm.addEventListener('submit', (e) => {
        e.preventDefault();
        showMessage(' Payment Successful! Your booking is confirmed. Redirecting to confirmation page...', true);
        onlineForm.reset();
    });

    cashConfirmBtn.addEventListener('click', () => {
        showMessage(' Booking Confirmed! Payment is due in cash at the base village. Check your email for details.', true);
        
        cashConfirmBtn.disabled = true;
        cashConfirmBtn.textContent = 'Booking Confirmed!';
    });
    
    switchTab('online-payment');
});