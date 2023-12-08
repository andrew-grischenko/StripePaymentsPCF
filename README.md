# Stripe payments PCF for Canvas Power App

This repo contains a solution for processing credit card payments via canvas Power Apps in Power Platform. It consists of:
* PowerApps Component Framework (PCF) control **tema_Technomancy.StripePayments3** embedding Stripe Elements UI and logic. 
* Custom connector **StripePaymentIntents** that integrates for Payment Intent Stripe API
* A simple demo canvas Power App **StripePaymentsDemo** showing how to use these to process card payments.

![Solution components](./media/StripePCF.png)

## Installation

Before you begin, you will need a Stripe pyments account. You can [create one here](https://dashboard.stripe.com/register) – it’s free for testing purposes.

You may install the components of this solution in 2 ways:
* Import the pre-packaged Power Platform solutions in this repo's **"build"** folder to deploy the components - this is the easiest way. You can use either managed solutions or unmanaged ones, if want to make some changes on the Power Platform side.  
* Use the source code to build and deploy the components. This is recommended only if you want to actually make changes in the solution code. 

### Import the pre-packaged Power Platform solutions

Download and import the solution packages:
* Managed solution, includes the custom connector and PCF components: [download managed solution](build/PowerAppsTools_tema_1_2_managed.zip)
* Unmanaged solution, includes the custom connector, PCF component and a demo canvas Power App (build/PowerAppsTools_tema_1_2_unmanaged.zip). 

Skip the next section *"Build from the source code"* and move on to the **Setup** section. 

### Build from the source code

Prerequsites: 
* Windows 10 or later with [.NET Framework 4.6.2](https://dotnet.microsoft.com/en-us/download/dotnet-framework/net462) (unfortunately, PCF doesn't support yet build on Mac due to use of this legacy framework version)
* [NodeJS 20 + NPM](https://nodejs.org/en/download)
* Visual Studio Code
* Power Platform Tools extension for VS Code (microsoft-IsvExpTools.powerplatform-vscode), containing [Power Platform CLI](https://learn.microsoft.com/en-us/power-platform/developer/cli/introduction). I used version v2.0.21 of the extension as I had some issues with the latest one v2.0.25.

1. Clone this repository:

       git clone https://github.com/andrew-grischenko/StripePaymentsPCF

2. Change the directory and install the Node dependencies 

       cd StripPaymentsPCF
       npm install

3. After you made the changes required, if any, build the PCF component and run it in the local environment to test:

       npm run build
       npm start watch

4. When you are happy with the behaviour, create an authentication profile to connect Power Platform CLI to your environment:

       cd .\Solutions\
       pac auth create -n <name of the profile of your choice> -env <environment id or name>
       pac auth select -i <index of the newly created profile>

5. Build, package and deploy the solution. Please note, you need to increment the PCF control version every time for the changes to take effect!

       pac pcf version -pv <increment version number every time>
       dotnet build
       pac solution pack
       pac solution import

Continue to the next section to set up the components of the solution.
 
## Setup and use

### Set up the custom connector StripePaymentIntents ###

1. Add a new connector to your Power App – find the **StripePaymentIntents** connector (added by the above steps):

![Stripe payments connector](media/stripe-payment-intent-custom.png)

Please do NOT use the standard Stripe connector as it doesn’t provide the required payment API methods:

![Do NOT use this standard connector](media/stripe-original.png)

2. Create a new connection for the custom connector and specify connection string as API key:

       Bearer <your_stripe_api_secret_key>

where:
* **Bearer** (and the following one space character) – the required authentication keyword.
* **<your_stripe_api_secret_key>** – the secret key from the Stripe account Dashboard (usually starting with "sk_")

You get the Stripe secret keys from the developers dashboard in Stripe account:

![Your secret Stripe key](media/stripe-keys.png)

### Setup the PCF component StripePayments ###

1. Before you can start using the component in your power app, make sure that the custom components for Power Apps are enabled as below. You can find this option in your environment settings and for new environments it's **Off** by default. Turn it **On**.  

![Enable PCF components in the environment](/media/pcf-enabled.PNG)

2. Import the PCF code component into your canvas app:

* Select menu *Insert > Custom > Import component*
* Select the *"Code"* tab
* Select the **StripePayments** component and import it
* On the left panel, find the *Insert* command ("plus" icon) and in the section "Code component" find the component **StripePayments3** and add it to the app screen.

![Insert Stripe component](media/pcf-insert-component.PNG)

2. Set the **StripeClientKey** attribute of the component with the **Publishable key** from your Stripe account

![Publishable key from your Stripe account](/media/stripe-publishable-key.png)

3. Set the **Customer** attribute with a customer reference as a string as per your business logic (optional)

4. Setup the visual appearance of the control (optional):

* **CardFontSize** – font size of the card number capture element
* **ButtonFontSize** – font size for the Pay button
* **ErrorFontSize** – font size of the error messages

4. Before your payment screen is shown and the payment amount is defined, e.g. on the *Next* button of the previous screen, add the formula to create the **PaymentIntent** object:

       Set(payment_intent, StripePaymentIntent.CreatePaymentIntent({ 
           amount: price * 100, 
           currency: "aud", 
           description: "test payment"
       }));
   
where:
* **payment_intent** – the variable to be used on the next step
* **StripePaymentIntent** – the custom connector object
* **amount** – the numeric value of the payment amount in hundredths of currency (e.g. cents). Please note, it cannot be less or more than [the specified limits on payment amount](https://stripe.com/docs/currencies#minimum-and-maximum-charge-amounts), otherwise, you will get an error.
* **currency** – currency code, must be [one supported by Stripe](https://stripe.com/docs/currencies).
* **description** – any description of your payment as you need it (can be empty)

5. Set the property **PaymentIntentClientSecret** of the **StripePayment** component to use the PaymentIntent’s object’s **client_secret** value which will be set by the previous code:

       payment_intent.client_secret

6. Handle the payment events – success and errors – with **OnChange** handler of the component by verifying the PaymentStatus attribute, e.g.

       If(StripeWidget.PaymentStatus = "completed", Navigate(Receipt)) 
       
![Component in the app, OnChange handler](/media/component-app.png)

7. For test integration, you can use the card number **“4242424242424242”** with any future expiry date and any 3 digit CVV code. See here for more test cards: https://stripe.com/docs/testing

## Demo canvas Power App ##

If you installed the unmanaged solution, you can find there a canvas Power App that implements the above logic. Feel free to explore, try or modify the app. 

Please note, you may get the warning window as below when opening the app for edit. This doesn't happen for a published app though.

![Warning PCF component](media/pcf-warning.PNG)


## References
* [Create your first component (typescript)](https://docs.microsoft.com/en-us/powerapps/developer/component-framework/implementing-controls-using-typescript) 
* [Package and deploy a code component](https://docs.microsoft.com/en-us/powerapps/developer/component-framework/import-custom-controls)