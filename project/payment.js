// Enhanced Payment processing functionality with station-based pricing
class PaymentProcessor {
    constructor() {
        this.supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://aivicvhrlkfswzmvldmf.supabase.co';
        this.supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpdmljdmhybGtmc3d6bXZsZG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMjc4MTYsImV4cCI6MjA2NjkwMzgxNn0.6Bph1EhdvJQWqKMHJHSqxXJhWiuPXGIwdOaNnvMeEkQ';
        this.currentTrip = null;
        this.authenticatedCard = null;
        
        // Station data
        this.algiersStations = ["Agha", "Ateliers", "H.Dey", "Caroubier", "El Harrach", "Gué de Cne", "Ain Naadja", "Baba Ali", "Birtouta", "Tessala El Merdja", "Sidi Abdellah", "Sidi Abdellah-University", "Zéralda"];
        this.oranStations = ["Agha", "El Harrach", "Blida", "Afroune", "Ain El Defla", "Chlef", "Relizane", "Oran"];
        
        this.init();
    }

    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupComponents();
            });
        } else {
            this.setupComponents();
        }
    }

    setupComponents() {
        this.setupEventListeners();
        this.setupFormValidation();
        this.setupStationPricing();
    }

    setupStationPricing() {
        // Add station selection form to payment page
        this.addStationSelectionForm();
        this.setupStationEventListeners();
    }

    addStationSelectionForm() {
        const paymentForm = document.querySelector('.payment-form');
        if (!paymentForm) {
            console.warn('Payment form not found, skipping station selection setup');
            return;
        }

        const passengerNameGroup = document.querySelector('#passengerName')?.closest('.form-group');
        if (!passengerNameGroup) {
            console.warn('Passenger name field not found, skipping station selection setup');
            return;
        }
        
        // Check if station selection already exists
        if (document.querySelector('.station-selection-section')) {
            return;
        }
        
        // Create station selection HTML
        const stationSelectionHTML = `
            <div class="station-selection-section">
                <h4 style="margin-bottom: 16px; color: #374151; font-weight: 600;">Trip Details</h4>
                
                <div class="form-group">
                    <label data-ar="الخط" data-en="Line">Line</label>
                    <select id="trainLine" name="trainLine" required>
                        <option value="">Select Line</option>
                        <option value="Algiers">Algiers Line</option>
                        <option value="Oran">Oran Line</option>
                    </select>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label data-ar="محطة الانطلاق" data-en="Start Station">Start Station</label>
                        <select id="startStation" name="startStation" required disabled>
                            <option value="">Select start station</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label data-ar="محطة الوصول" data-en="End Station">End Station</label>
                        <select id="endStation" name="endStation" required disabled>
                            <option value="">Select end station</option>
                        </select>
                    </div>
                </div>

                <div class="calculated-price" id="calculatedPrice" style="display: none;">
                    <div class="price-breakdown">
                        <span class="price-label" data-ar="سعر التذكرة:" data-en="Ticket Price:">Ticket Price:</span>
                        <span class="price-value" id="ticketPrice">0 DA</span>
                    </div>
                </div>
            </div>
        `;

        // Insert before passenger name field
        passengerNameGroup.insertAdjacentHTML('beforebegin', stationSelectionHTML);
    }

    setupStationEventListeners() {
        const trainLineSelect = document.getElementById('trainLine');
        const startStationSelect = document.getElementById('startStation');
        const endStationSelect = document.getElementById('endStation');

        if (trainLineSelect) {
            trainLineSelect.addEventListener('change', (e) => this.handleLineChange(e.target.value));
        }

        if (startStationSelect) {
            startStationSelect.addEventListener('change', () => this.calculatePrice());
        }

        if (endStationSelect) {
            endStationSelect.addEventListener('change', () => this.calculatePrice());
        }
    }

    handleLineChange(selectedLine) {
        const startStationSelect = document.getElementById('startStation');
        const endStationSelect = document.getElementById('endStation');
        
        if (!startStationSelect || !endStationSelect) {
            console.warn('Station select elements not found');
            return;
        }
        
        // Clear existing options
        startStationSelect.innerHTML = '<option value="">Select start station</option>';
        endStationSelect.innerHTML = '<option value="">Select end station</option>';
        
        let stations = [];
        if (selectedLine === 'Algiers') {
            stations = this.algiersStations;
        } else if (selectedLine === 'Oran') {
            stations = this.oranStations;
        }

        // Populate station options
        stations.forEach((station, index) => {
            const startOption = document.createElement('option');
            startOption.value = index;
            startOption.textContent = station;
            startStationSelect.appendChild(startOption);

            const endOption = document.createElement('option');
            endOption.value = index;
            endOption.textContent = station;
            endStationSelect.appendChild(endOption);
        });

        // Enable station selects
        startStationSelect.disabled = false;
        endStationSelect.disabled = false;

        // Hide price until stations are selected
        this.hidePriceDisplay();
    }

    calculatePrice() {
        const trainLineElement = document.getElementById('trainLine');
        const startStationElement = document.getElementById('startStation');
        const endStationElement = document.getElementById('endStation');

        if (!trainLineElement || !startStationElement || !endStationElement) {
            console.warn('Price calculation elements not found');
            return;
        }

        const trainLine = trainLineElement.value;
        const startStationIndex = parseInt(startStationElement.value);
        const endStationIndex = parseInt(endStationElement.value);

        if (!trainLine || isNaN(startStationIndex) || isNaN(endStationIndex)) {
            this.hidePriceDisplay();
            return;
        }

        if (startStationIndex === endStationIndex) {
            this.hidePriceDisplay();
            return;
        }

        let price = 0;
        if (trainLine === "Algiers") {
            price = 30 + (Math.abs(endStationIndex - startStationIndex) * 15);
        } else if (trainLine === "Oran") {
            price = 400 + (Math.abs(endStationIndex - startStationIndex) * 100);
        }

        this.displayPrice(price);
        this.updateTotalAmount(price);
    }

    displayPrice(price) {
        const calculatedPriceDiv = document.getElementById('calculatedPrice');
        const ticketPriceSpan = document.getElementById('ticketPrice');
        
        if (calculatedPriceDiv && ticketPriceSpan) {
            ticketPriceSpan.textContent = `${price} DA`;
            calculatedPriceDiv.style.display = 'block';
        }
    }

    hidePriceDisplay() {
        const calculatedPriceDiv = document.getElementById('calculatedPrice');
        if (calculatedPriceDiv) {
            calculatedPriceDiv.style.display = 'none';
        }
        this.updateTotalAmount(150); // Default amount
    }

    updateTotalAmount(amount) {
        const totalAmountSpan = document.getElementById('totalAmount');
        if (totalAmountSpan) {
            totalAmountSpan.textContent = `${amount} DA`;
        }
    }

    setupEventListeners() {
        // Payment form submission
        const paymentForm = document.getElementById('paymentForm');
        if (paymentForm) {
            paymentForm.addEventListener('submit', (e) => this.handlePaymentSubmission(e));
        }

        // Card number formatting and authentication
        const cardNumberInput = document.getElementById('cardNumber');
        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', this.formatCardNumber);
            cardNumberInput.addEventListener('blur', (e) => this.authenticateCard());
        }

        // Expiry date formatting
        const expiryInput = document.getElementById('expiryDate');
        if (expiryInput) {
            expiryInput.addEventListener('input', this.formatExpiryDate);
            expiryInput.addEventListener('blur', () => this.authenticateCard());
        }

        // CVV validation
        const cvvInput = document.getElementById('cvv');
        if (cvvInput) {
            cvvInput.addEventListener('input', this.formatCVV);
            cvvInput.addEventListener('blur', () => this.authenticateCard());
        }

        // Phone number validation
        const phoneInput = document.getElementById('phoneNumber');
        if (phoneInput) {
            phoneInput.addEventListener('blur', () => this.authenticateCard());
        }

        // Real-time authentication when all card fields are filled
        const cardInputs = ['cardNumber', 'cvv', 'expiryDate'];
        cardInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', () => {
                    // Clear previous authentication state when user modifies card details
                    this.clearCardAuthentication();
                });
            }
        });
    }

    setupFormValidation() {
        // Add visual feedback for form validation
        const inputs = document.querySelectorAll('#paymentForm input[required], #paymentForm select[required]');
        inputs.forEach(input => {
            input.addEventListener('blur', (e) => this.validateField(e.target));
            input.addEventListener('input', (e) => this.clearFieldError(e.target));
        });
    }

    formatCardNumber(e) {
        let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
        let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
        if (formattedValue.length > 19) formattedValue = formattedValue.substr(0, 19);
        e.target.value = formattedValue;
    }

    formatExpiryDate(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        e.target.value = value;
    }

    formatCVV(e) {
        let value = e.target.value.replace(/\D/g, '');
        e.target.value = value.substring(0, 3);
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        switch (field.id) {
            case 'trainLine':
                isValid = value !== '';
                errorMessage = 'Please select a train line';
                break;
            case 'startStation':
                isValid = value !== '';
                errorMessage = 'Please select start station';
                break;
            case 'endStation':
                isValid = value !== '';
                errorMessage = 'Please select end station';
                break;
            case 'passengerName':
                isValid = value.length >= 2;
                errorMessage = 'Name must be at least 2 characters';
                break;
            case 'phoneNumber':
                isValid = /^(\+213|0)[0-9]{9}$/.test(value.replace(/\s/g, ''));
                errorMessage = 'Please enter a valid Algerian phone number';
                break;
            case 'email':
                isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                errorMessage = 'Please enter a valid email address';
                break;
            case 'cardNumber':
                isValid = value.replace(/\s/g, '').length === 16;
                errorMessage = 'Card number must be 16 digits';
                break;
            case 'expiryDate':
                isValid = /^(0[1-9]|1[0-2])\/\d{2}$/.test(value);
                errorMessage = 'Please enter MM/YY format';
                break;
            case 'cvv':
                isValid = /^\d{3}$/.test(value);
                errorMessage = 'CVV must be 3 digits';
                break;
        }

        this.setFieldValidation(field, isValid, errorMessage);
        return isValid;
    }

    setFieldValidation(field, isValid, errorMessage) {
        const formGroup = field.closest('.form-group');
        if (!formGroup) return;

        const existingError = formGroup.querySelector('.field-error');

        if (existingError) {
            existingError.remove();
        }

        if (isValid) {
            field.classList.remove('error');
            field.classList.add('valid');
        } else {
            field.classList.remove('valid');
            field.classList.add('error');
            
            const errorDiv = document.createElement('div');
            errorDiv.className = 'field-error';
            errorDiv.textContent = errorMessage;
            formGroup.appendChild(errorDiv);
        }
    }

    clearFieldError(field) {
        field.classList.remove('error');
        const formGroup = field.closest('.form-group');
        if (!formGroup) return;

        const existingError = formGroup.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }

    clearCardAuthentication() {
        this.authenticatedCard = null;
        this.hideCardAuthentication();
        this.hideBalanceDisplay();
        
        // Disable payment button until card is authenticated
        const payButton = document.querySelector('.pay-btn');
        if (payButton) {
            payButton.disabled = true;
            payButton.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                <span data-ar="يرجى التحقق من البطاقة" data-en="Please verify card">Please verify card</span>
            `;
        }
    }

    async authenticateCard() {
        const cardNumber = document.getElementById('cardNumber')?.value;
        const cvv = document.getElementById('cvv')?.value;
        const expiryDate = document.getElementById('expiryDate')?.value;
        const phoneNumber = document.getElementById('phoneNumber')?.value;

        // Check if all required card fields are filled
        if (!cardNumber || !cvv || !expiryDate) {
            return;
        }

        const cleanCardNumber = cardNumber.replace(/\s/g, '');
        if (cleanCardNumber.length !== 16 || cvv.length !== 3 || !expiryDate.includes('/')) {
            return;
        }

        const [month, year] = expiryDate.split('/');
        if (!month || !year) return;

        try {
            // Show authentication in progress
            this.showCardAuthentication('pending', 'Verifying card...');

            const response = await fetch(`${this.supabaseUrl}/functions/v1/authenticate-card`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.supabaseKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cardNumber: cleanCardNumber,
                    ccv: cvv,
                    expiryMonth: parseInt(month),
                    expiryYear: parseInt('20' + year),
                    phoneNumber: phoneNumber
                })
            });

            const result = await response.json();
            
            if (result.authenticated) {
                this.authenticatedCard = result;
                this.showCardAuthentication('success', `Welcome ${result.cardholderName}! Card verified.`);
                this.updateBalanceDisplay(result.balance);
                this.enablePaymentButton();
            } else {
                this.authenticatedCard = null;
                this.showCardAuthentication('error', result.message);
                this.hideBalanceDisplay();
                this.disablePaymentButton();
            }
        } catch (error) {
            console.error('Card authentication error:', error);
            this.authenticatedCard = null;
            this.showCardAuthentication('error', 'Unable to verify card. Please try again.');
            this.hideBalanceDisplay();
            this.disablePaymentButton();
        }
    }

    showCardAuthentication(status, message) {
        const cardNumberField = document.getElementById('cardNumber');
        if (!cardNumberField) return;

        const formGroup = cardNumberField.closest('.form-group');
        if (!formGroup) return;
        
        // Remove existing authentication message
        const existingAuth = formGroup.querySelector('.card-authentication');
        if (existingAuth) {
            existingAuth.remove();
        }

        // Add new authentication message
        const authDiv = document.createElement('div');
        authDiv.className = `card-authentication ${status}`;
        
        let icon = '';
        switch (status) {
            case 'success':
                icon = '<path d="M20 6L9 17l-5-5"/>';
                break;
            case 'error':
                icon = '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>';
                break;
            case 'pending':
                icon = '<path d="M21 12a9 9 0 11-6.219-8.56"/>';
                authDiv.classList.add('pending');
                break;
        }

        authDiv.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${icon}
            </svg>
            <span>${message}</span>
        `;
        formGroup.appendChild(authDiv);
    }

    hideCardAuthentication() {
        const authMessage = document.querySelector('.card-authentication');
        if (authMessage) {
            authMessage.remove();
        }
    }

    enablePaymentButton() {
        const payButton = document.querySelector('.pay-btn');
        if (payButton) {
            payButton.disabled = false;
            payButton.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span data-ar="ادفع الآن" data-en="Pay Now">Pay Now</span>
            `;
        }
    }

    disablePaymentButton() {
        const payButton = document.querySelector('.pay-btn');
        if (payButton) {
            payButton.disabled = true;
            payButton.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                <span data-ar="يرجى التحقق من البطاقة" data-en="Please verify card">Please verify card</span>
            `;
        }
    }

    updateBalanceDisplay(balance) {
        // Remove existing balance display first
        this.hideBalanceDisplay();
        
        const balanceDiv = this.createBalanceDisplay();
        if (balanceDiv) {
            balanceDiv.innerHTML = `
                <div class="balance-info">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                        <line x1="1" y1="10" x2="23" y2="10"/>
                    </svg>
                    <span>Available Balance: ${balance.toFixed(2)} DA</span>
                </div>
            `;
        }
    }

    hideBalanceDisplay() {
        const balanceDisplay = document.querySelector('.balance-display');
        if (balanceDisplay) {
            balanceDisplay.remove();
        }
    }

    createBalanceDisplay() {
        const paymentForm = document.getElementById('paymentForm');
        const totalAmount = document.querySelector('.total-amount');
        
        if (!paymentForm || !totalAmount) {
            console.warn('Payment form or total amount element not found for balance display');
            return null;
        }

        const balanceDiv = document.createElement('div');
        balanceDiv.className = 'balance-display';
        
        // Find the correct parent container for the total amount element
        const totalAmountParent = totalAmount.parentNode;
        
        // Insert the balance display before the total amount's parent container
        try {
            totalAmountParent.parentNode.insertBefore(balanceDiv, totalAmountParent);
            return balanceDiv;
        } catch (error) {
            console.error('Error inserting balance display:', error);
            // Fallback: append to payment form
            paymentForm.appendChild(balanceDiv);
            return balanceDiv;
        }
    }

    async handlePaymentSubmission(e) {
        e.preventDefault();

        // Check if card is authenticated
        if (!this.authenticatedCard) {
            this.showPaymentError('Please verify your card before proceeding with payment');
            return;
        }

        // Validate all fields
        const form = e.target;
        const inputs = form.querySelectorAll('input[required], select[required]');
        let isFormValid = true;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isFormValid = false;
            }
        });

        // Additional validation for station selection
        const startStationElement = document.getElementById('startStation');
        const endStationElement = document.getElementById('endStation');
        
        if (startStationElement && endStationElement) {
            const startStation = startStationElement.value;
            const endStation = endStationElement.value;
            
            if (startStation === endStation) {
                this.showPaymentError('Start and end stations cannot be the same');
                return;
            }
        }

        if (!isFormValid) {
            this.showPaymentError('Please correct the errors above');
            return;
        }

        // Show loading state
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = `
            <svg class="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
            <span>Processing...</span>
        `;
        submitButton.disabled = true;

        try {
            // Get form data
            const formData = new FormData(form);
            const paymentData = {
                passengerName: formData.get('passengerName') || document.getElementById('passengerName')?.value,
                phoneNumber: formData.get('phoneNumber') || document.getElementById('phoneNumber')?.value,
                email: formData.get('email') || document.getElementById('email')?.value,
                cardNumber: document.getElementById('cardNumber')?.value,
                ccv: document.getElementById('cvv')?.value,
                expiryDate: document.getElementById('expiryDate')?.value,
                amount: this.extractAmount(document.getElementById('totalAmount')?.textContent || '150 DA')
            };

            // Parse expiry date
            const [month, year] = paymentData.expiryDate.split('/');
            
            // Get station information
            const trainLineElement = document.getElementById('trainLine');
            const startStationElement = document.getElementById('startStation');
            const endStationElement = document.getElementById('endStation');
            
            let tripDetails = {
                line: 'Algiers',
                from: 'Agha',
                to: 'Zéralda',
                date: new Date().toISOString().split('T')[0],
                trainNumber: '1501',
                departureTime: '05:10',
                arrivalTime: '05:58'
            };

            if (trainLineElement && startStationElement && endStationElement) {
                const trainLine = trainLineElement.value;
                const startStationIndex = parseInt(startStationElement.value);
                const endStationIndex = parseInt(endStationElement.value);
                
                const stations = trainLine === 'Algiers' ? this.algiersStations : this.oranStations;
                const startStationName = stations[startStationIndex];
                const endStationName = stations[endStationIndex];
                
                tripDetails = {
                    line: trainLine,
                    from: startStationName,
                    to: endStationName,
                    date: new Date().toISOString().split('T')[0],
                    trainNumber: trainLine === 'Algiers' ? '1501' : '2001',
                    departureTime: '05:10',
                    arrivalTime: '05:58'
                };
            }
            
            // Prepare payment request
            const paymentRequest = {
                cardNumber: paymentData.cardNumber,
                ccv: paymentData.ccv,
                expiryMonth: parseInt(month),
                expiryYear: parseInt('20' + year),
                phoneNumber: paymentData.phoneNumber,
                amount: paymentData.amount,
                passengerName: paymentData.passengerName,
                tripDetails: tripDetails
            };

            // Process payment
            const response = await fetch(`${this.supabaseUrl}/functions/v1/process-payment`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.supabaseKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(paymentRequest)
            });

            const result = await response.json();

            if (result.success) {
                // Store ticket data for display
                this.storeTicketData({
                    ...paymentRequest,
                    transactionId: result.transactionId,
                    remainingBalance: result.remainingBalance
                });

                // Show success and redirect to ticket
                this.showPaymentSuccess('Payment successful! Redirecting to your ticket...');
                
                setTimeout(() => {
                    this.showTicketPage();
                }, 2000);
            } else {
                this.showPaymentError(result.message);
            }

        } catch (error) {
            console.error('Payment error:', error);
            this.showPaymentError('Payment processing failed. Please try again.');
        } finally {
            // Restore button state
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }
    }

    extractAmount(amountText) {
        const match = amountText.match(/(\d+(?:\.\d{2})?)/);
        return match ? parseFloat(match[1]) : 150.00;
    }

    showPaymentError(message) {
        this.showPaymentMessage(message, 'error');
    }

    showPaymentSuccess(message) {
        this.showPaymentMessage(message, 'success');
    }

    showPaymentMessage(message, type) {
        // Remove existing messages
        const existingMessage = document.querySelector('.payment-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `payment-message ${type}`;
        messageDiv.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${type === 'success' ? 
                    '<path d="M20 6L9 17l-5-5"/>' : 
                    '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'
                }
            </svg>
            <span>${message}</span>
        `;

        // Insert message safely
        const paymentForm = document.querySelector('.payment-form');
        if (paymentForm) {
            paymentForm.insertBefore(messageDiv, paymentForm.firstChild);
        }

        // Auto-remove error messages after 5 seconds
        if (type === 'error') {
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 5000);
        }
    }

    storeTicketData(ticketData) {
        localStorage.setItem('currentTicket', JSON.stringify(ticketData));
    }

    showTicketPage() {
        const paymentPage = document.getElementById('paymentPage');
        const ticketPage = document.getElementById('ticketPage');
        
        if (paymentPage) paymentPage.style.display = 'none';
        if (ticketPage) ticketPage.style.display = 'block';
        
        this.populateTicket();
    }

    populateTicket() {
        const ticketData = JSON.parse(localStorage.getItem('currentTicket') || '{}');
        
        // Update ticket information
        if (ticketData.tripDetails) {
            const fromCodeElement = document.getElementById('fromCode');
            const fromNameElement = document.getElementById('fromName');
            const toCodeElement = document.getElementById('toCode');
            const toNameElement = document.getElementById('toName');
            const departureTimeElement = document.getElementById('departureTime');
            const arrivalTimeElement = document.getElementById('arrivalTime');
            const ticketTrainElement = document.getElementById('ticketTrain');

            if (fromCodeElement) fromCodeElement.textContent = this.getStationCode(ticketData.tripDetails.from);
            if (fromNameElement) fromNameElement.textContent = ticketData.tripDetails.from;
            if (toCodeElement) toCodeElement.textContent = this.getStationCode(ticketData.tripDetails.to);
            if (toNameElement) toNameElement.textContent = ticketData.tripDetails.to;
            if (departureTimeElement) departureTimeElement.textContent = ticketData.tripDetails.departureTime;
            if (arrivalTimeElement) arrivalTimeElement.textContent = ticketData.tripDetails.arrivalTime;
            if (ticketTrainElement) ticketTrainElement.textContent = ticketData.tripDetails.trainNumber;
        }

        const ticketPassengerElement = document.getElementById('ticketPassenger');
        const ticketDateElement = document.getElementById('ticketDate');
        const ticketSeatElement = document.getElementById('ticketSeat');
        const ticketPriceElement = document.getElementById('ticketPrice');
        const bookingRefElement = document.getElementById('bookingRef');

        if (ticketPassengerElement) ticketPassengerElement.textContent = ticketData.passengerName || 'PASSENGER';
        if (ticketDateElement) {
            ticketDateElement.textContent = new Date().toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: '2-digit'
            }).toUpperCase();
        }
        if (ticketSeatElement) ticketSeatElement.textContent = this.generateSeatNumber();
        if (ticketPriceElement) ticketPriceElement.textContent = `${ticketData.amount || 150} DA`;
        if (bookingRefElement) bookingRefElement.textContent = ticketData.transactionId || 'ALG2025010001';
    }

    getStationCode(stationName) {
        const codes = {
            'Agha': 'AGH',
            'Ateliers': 'ATL',
            'H.Dey': 'HDY',
            'Caroubier': 'CRB',
            'El Harrach': 'ELH',
            'Gué de Cne': 'GDC',
            'Ain Naadja': 'ANN',
            'Baba Ali': 'BAL',
            'Birtouta': 'BRT',
            'Tessala El Merdja': 'TEM',
            'Sidi Abdellah': 'SDA',
            'Sidi Abdellah-University': 'SDU',
            'Zéralda': 'ZRL',
            'Blida': 'BLD',
            'Afroune': 'AFR',
            'Ain El Defla': 'AED',
            'Chlef': 'CHL',
            'Relizane': 'REL',
            'Oran': 'ORN'
        };
        return codes[stationName] || stationName.substring(0, 3).toUpperCase();
    }

    generateSeatNumber() {
        const letters = 'ABCDEF';
        const letter = letters[Math.floor(Math.random() * letters.length)];
        const number = Math.floor(Math.random() * 20) + 1;
        return `${letter}${number}`;
    }

    setTripDetails(tripDetails) {
        this.currentTrip = tripDetails;
    }
}

// Initialize payment processor when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.paymentProcessor = new PaymentProcessor();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PaymentProcessor;
}