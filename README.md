# StripePaymentsPCF

This is a simple PCF control and a customer connector that allow to facilitate credit card payments in Power Apps via Stripe. 

## Install and Use

Before you negin, create a Stripe account here: https://dashboard.stripe.com/register – it’s free for testing purposes. You will need it to facilitate the payments.

### Import as a solution package

Download and import the managed solution package [**PowerAppsTools_tema_1_2_managed.zip**](https://github.com/andrew-grischenko/StripePaymentsPCF/raw/master/build/PowerAppsTools_tema_1_2_managed.zip) or unmanaged package [**PowerAppsTools_tema_1_2_unmanaged.zip**](https://github.com/andrew-grischenko/StripePaymentsPCF/raw/master/build/PowerAppsTools_tema_1_2_unmanaged.zip). As a result, you should get the solution **PowerAppsTools_tema** containing:
* Custom connector **StripePaymentIntents**  
* Code PCF component **tema_Technomancy.StripePayments3** hosting the credit capture form from Stripe
* Demo canvas Power App **StripePaymentsDemo** using the above two

Skip the next section *"Build from the source"* if you just want to set up and use the solution. 

### Build from the source

Prerequsites: 
* NPM 
* Windows OS
* VS Code

1. Install Power Apps CLI and all its dependencies as described here: https://docs.microsoft.com/en-us/powerapps/developer/common-data-service/powerapps-cli 
2. Clone the repository https://github.com/andrew-grischenko/StripePaymentsPCF into a folder
3. Run the commands in the folder 

       npm install 

4. Follow the instruction here on how to

* build and test the component: https://docs.microsoft.com/en-us/powerapps/developer/component-framework/implementing-controls-using-typescript 
* packgae and deploy the component: https://docs.microsoft.com/en-us/powerapps/developer/component-framework/import-custom-controls 


### Set up the custom connector StripePaymentIntents ###

1. Add a new connector to your Power App – find the **StripePaymentIntents** connector (added by the imported solution):

![Stripe payments connector](https://technomancy.com.au/wp-content/uploads/2020/03/Screen-Shot-2020-03-29-at-5.40.28-pm.png)

Please do NOT use the standard Stripe connector as it doesn’t provide the required payment API methods:

![Do NOT use this standard connector](https://technomancy.com.au/wp-content/uploads/2020/03/Screen-Shot-2020-03-29-at-5.40.41-pm.png)

2. Create a new connection for the custom connector and specify connection string as API key:

       Bearer your_stripe_api_secret_key

where:
* **Bearer** (and the following one space character) – the required authentication keyword.
* ***your_stripe_api_secret_key*** – the secret key from the Stripe account Dashboard (usually starting with sk_)

![Your secret Stripe key](https://technomancy.com.au/wp-content/uploads/2020/03/Screen-Shot-2020-03-29-at-5.31.42-pm-1024x179.png)

### Setup the code component StripePayments and the app logic ###

1. Import a code component (PCF control):

* Select menu *Insert > Custom > Import component*
* Select the *"Code"* tab
* Select the **StripePayments** component and import it
* On the left .... find teh component and add it to a screen

2. Set up the **StripeClientKey** attribute with the **Publishable key** from your Stripe account

![Publishable key from your Stripe account](https://technomancy.com.au/wp-content/uploads/2020/03/publishable-1024x182.png)

3. Setup the **Customer** attribute with a customer reference as a string as per your business logic (optional)

4. Setup the visual appearance of the control (optional):

* **CardFontSize** – font size of the card number capture element
* **ButtonFontSize** – font size for the Pay button
* **ErrorFontSize** – font size of the error messages

4. Get the **PaymentIntent** object when the payment amount is known. Execute the connector function **CreatePaymentIntent** and store it in a variable, e.g:

       Set(payment_intent, StripePaymentIntent.CreatePaymentIntent({ 
           amount: price * 100, 
           currency: "aud", 
           description: "test payment"
       }));
   
where:
* **payment_intent** – the variable to be used on the next step
* **StripePaymentIntent** – the connector object
* **amount** – the numeric value of the payment amount in hundredths of currency (e.g. cents). Please note, it cannot be less or more than [the specified limits on payment amount](https://stripe.com/docs/currencies#minimum-and-maximum-charge-amounts), otherwise, you will get an error like 

        “StripePaymentIntent.CreatePaymentIntent failed: { “error”: { “code”: “parameter_invalid_integer”,  
        “doc_url”: “https://stripe.com/docs/error-codes/parameter-invalid-integer”, 
        “message”: “This value must be greater than or equal to 1.”, “param”: “amount”, 
        “type”: “invalid_request_error” } }

* **100** – the multiplier to get the expected amount
* **“aud”** – currency code, must be [one supported by Stripe](https://stripe.com/docs/currencies).
* **description** – any string, can be empty

5. Set the property **PaymentIntentClientSecret** of the **StripePayment** component to use the PaymentIntent’s object’s **client_secret** value:

       payment_intent.client_secret

6. Handle the payment events – success and errors – with **OnChange** handler of the component by verifying the PaymentStatus attribute, e.g.

       If(StripeWidget.PaymentStatus = "completed", Navigate(Receipt)) 
       
![OnChange handler](https://technomancy.com.au/wp-content/uploads/2020/03/app-1024x522.png)

7. For test integration, you can use the card number **“4242424242424242”** with any future expiry date and any 3 digit CVV code. See here for more test cards: https://stripe.com/docs/testing
