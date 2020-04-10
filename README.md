# StripePaymentsPCF

This is a simple PCF control and a customer connector that allow to facilitate credit card payments in Power Apps via Stripe. 

## Install and Use

1. Create a Stripe account here https://dashboard.stripe.com/register – it’s free for testing purposes. 
2. Import the managed solution package into the environment as per the usual process. As a result, you should get the following:

Custom connector to the Stripe PaymentIntents API
Code PCF component hosting the credit capture form from Stripe
Demo canvas PowerApp using the above two
Demo canvas Power App
Launch the StripePaymentsDemo app to see the demonstration of the components in action:


Sign up for Stripe APIs and SaaS here: https://dashboard.stripe.com/register 

Set up the custom connector StripePaymentIntents
Add a new connector to your Power App – find the StripePaymentIntents connector (added by the imported solution).

The connector required for Stripe payments
Please do NOT use the standard Stripe connector as it doesn’t provide the required payment API methods.


Do not use that
2. Create a new connection for the custom connector and specify as API key the string as:

Bearer your_stripe_api_secret_key
where:

Bearer (and the following space character) – the required authentication keyword.
your_stripe_api_secret_key – the secret key from the Stripe account Dashboard (usually starting with sk_)

Setup the code component StripePayments and app logic
Import a code component through “Insert > Custom > Import component”

2. Set up the properties of the component:

StripeClientKey – the Publishable key from the your Stripe account

3. Setup the Customer attribute with a customer reference as a string (optional)

4. Setup the visual appearance (optional):

CardFontSize – font size of the card number capture element
ButtonFontSize – font size for the Pay button
ErrorFontSize – font size of the error messages
4. Get the PaymentIntent object when the payment amount is known. Execute the connector function CreatePaymentIntent and store it in a variable, e.g:

Set(payment_intent, StripePaymentIntent.CreatePaymentIntent(
   { 
      amount: price * 100, 
      currency: "aud", 
      description: "test payment"
   }
));
where:

payment_intent – the variable to be used on the next step
StripePaymentIntent – the connector object
amount – the numeric value of the payment amount in hundredths of currency (e.g. cents).
please note, it cannot be less or more than the specified limits on payment amount, otherwise, you will get an error like “StripePaymentIntent.CreatePaymentIntent failed: { “error”: { “code”: “parameter_invalid_integer”, “doc_url”: “https://stripe.com/docs/error-codes/parameter-invalid-integer”, “message”: “This value must be greater than or equal to 1.”, “param”: “amount”, “type”: “invalid_request_error” } }
100 – the multiplier to get the expected amount
“aud” – currency code, must be one supported by Stripe.
description – any string, can be empty
If you get the following error, it’s like

5. Set the property PaymentIntentClientSecret of the StripePayment component to use the PaymentIntent’s object’s client_secret value:

payment_intent.client_secret
6. Handle the payment events – success and errors – OnChange handler of the component by verifying the PaymentStatus attribute, e.g.

If(StripeWidget.PaymentStatus = "completed", Navigate(Receipt)) 

7. For test integration, you can use the test credit card numbers as described here. You can use card number “4242424242424242” with any future expiry date and any 3 digit CVV code.

