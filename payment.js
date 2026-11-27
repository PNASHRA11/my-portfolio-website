//========================================================
// GET LEAD NUMBER FROM URL
// =======================================================
const ulrParams=new URLSearchParams(window.location.search);
const leadNumber=ulrParams.get("lead");

console.log("CURRENT URL =",window.location.href);
console.log("LEAD NUMBER =",leadNumber);

//========================================================
// CHECK LEAD NUMBER
// =======================================================
if(!leadNumber){
    document.getElementById("clientName").textContent="Invalid  Payment Link.";
    document.getElementById("projectName").textContent="-";
    document.getElementById("leadNumber").textContent="-";
    document.getElementById("paymentStatus").textContent="payment link is invalid.";
    document.getElementById("orderStatus").textContent="-";
    document.getElementById("paymentButton").style.display="none";
}else{
    loadPaymentDetails();
    loadPaymentHistory();
}

//========================================================
// LOAD PAYMENT HISTORY
//========================================================

function loadPaymentHistory(){
    fetch("http://localhost:5000/api/payment-history/"+leadNumber).then(function(response){
        if(!response.ok){
            throw new Error("Payment history could not be loaded.");
        }
        return response.json();
    })
    .then(function(result){
        if(!result.success){
            throw new Error(result.message || "Payment history not found.");
        }
        showPaymentHistory(result.data);
    })
    .catch(function(error){
        console.log("Payment history Error :",error);

        document.getElementById("paymentHistory").innerHTML = "<p>unable to load payment history.</p>";
    });
}

function showPaymentHistory(history){
    const historyContainer=document.getElementById("paymentHistory");

    if(!history || history.length === 0){
        historyContainer.innerHTML="<p>No payment history available. </p>";

        return;
    }
    historyContainer.innerHTML="";
    history.slice().reverse().forEach(function(payment){
        const historyItem=document.createElement("div");
        historyItem.className="payment-history-item";

        const paymentDate=new Date(payment.paymentDate);

        historyItem.innerHTML=`<div>
        <strong>${payment.paymentId}</strong>
        <span>${payment.paymentType === "advance" ? "Advance Payment" : "Remaining Payment"}</span>
        </div>
        <div>
        <strong>₹ ${Number(payment.amount).toLocaleString("en-IN")}</strong>
        <span>${payment.paymentStatus}</span>
        </div>
        <div>
        <span>Payment Mode</span>
        <strong>${payment.paymentMode || "-"}</strong>\
        </div>
        <div>
        <span>Date </span>
        <strong>${paymentDate.toLocaleString("en-IN")} </strong></div>
        <div>
        <span>Transaction ID </span>
        <strong> ${payment.transactionId || "-"}</strong>
        </div>
        
        <div>
        <button type="button" onclick="downloadInvoice('${payment.paymentId}')">Download Invoice </button>
        </div>
        `;

        historyContainer.appendChild(historyItem);
    });
}
function downloadInvoice(paymentId){
    console.log("Invoice Payment ID:",paymentId);
    const invoiceUrl="http://localhost:5000/api/invoice/"+ encodeURIComponent(paymentId);

    console.log("Invoice URL:",invoiceUrl);
    window.location.href=invoiceUrl;

    // window.open(invoiceUrl,"_blank");
}
//========================================================
// LOAD PAYMENT DETAILS
// =======================================================
function loadPaymentDetails(){
    fetch("http://localhost:5000/api/payment-page/"+leadNumber)
    .then(function(response){
        if(!response.ok){
            throw new Error("Payment details could not be loaded.");
        }
        return response.json();
    })
    .then(function(result){
        if(!result.success){
            throw new Error(result.message || "Payment details not found.");
        }

        showPaymentDetails(result.data);
    })
    .catch(function(error){
        console.log("Payment page Error :",error);

        document.getElementById("clientName").textContent="Payment details not found.";
        document.getElementById("paymentStatus").textContent="Unable to load payment information.";
        document.getElementById("paymentButton").style.display="none";
    
    });
}

//========================================================
// SHOW PAYMENT DETAILS
// =======================================================
function showPaymentDetails(data){
    document.getElementById("clientName").textContent= data.clientName;
    document.getElementById("projectName").textContent= data. projectType;
    document.getElementById("leadNumber").textContent="#"+data.leadNumber;
    document.getElementById("totalAmount").textContent="₹"+data.totalProjectAmount.toLocaleString("en-IN");
    document.getElementById("paidAmount").textContent="₹"+data.paidAmount.toLocaleString("en-IN");
    document.getElementById("remainingAmount").textContent="₹"+data.remainingAmount.toLocaleString("en-IN");
    document.getElementById("paymentStatus").textContent="Payment Status :"+ data.paymentStatus;
    document.getElementById("orderStatus").textContent="Order Status :"+ data.orderStatus;

   // ================================================
   // PAYMENT ACCTION
   // ================================================

   if(data.remainingAmount <=0){
    document.getElementById("paymentTitle").textContent="payment completed";
    document.getElementById("paymentMessage").textContent="Your project payment is fdully completed";
    document.getElementById("payAmount").textContent="₹0";
    document.getElementById("paymentButton").textContent="✓ FULLY paid";

    document.getElementById("paymentButton").disabled=true;
    return;
   }
let amountToPay=0;

// ====================================================
// ADVANCE PAYMENT
// ====================================================
if(data.advanceRequired && data.paidAmount===0){
    amountToPay=data.advanceAmount;

    document.getElementById("paymentTitle").textContent="Advance Payment";
    document.getElementById("paymentMessage").textContent="60% advance payment is required to confirm your project.";
}

// ====================================================
// REMAINING PAYMENT
// ====================================================
else{
    amountToPay=data.remainingAmount;
    document.getElementById("paymentTitle").textContent="Remaining Payment";
    document.getElementById("paymentMessage").textContent="Please complete the remaining payment.";
}

document.getElementById("payAmount").textContent="₹"+ amountToPay.toLocaleString("en-IN");

document.getElementById("paymentButton").textContent="PAY ₹"+ amountToPay.toLocaleString("en-IN");

// ====================================================
// PAYMENT BUTTON
// ====================================================
document.getElementById("paymentButton").onclick=function(){
    console.log("Dummy Payment button clicked.");
    console.log("Amount =",amountToPay);

    const confirmPayment=confirm(
        "Confirm Dummy Payment?\n\n" +
        "Client :" + data.clientName + "\n" +
        "Lead :# " + data.leadNumber + "\n" +
        "Amount : ₹" + amountToPay.toLocaleString("en-IN")
    );

    if(!confirmPayment){
        return;
    }

    const paymentType=data.advanceRequired && data.paidAmount === 0 ? "advance"
    : "remaining";

    const paymentData={
        leadNumber : data.leadNumber,
        clientName: data.clientName,
        project:data.projectType,
        totalProjectAmount:data.totalProjectAmount,
        paymentType:paymentType,
        amount:amountToPay,
        paymentMode:"dummy",
        gatewayPaymentId:"DUMMY -" + Date.now(),
        transactionId :"TEST -" + Date.now(),
        paymentStatus : "paid"
    };

    console.log("Sending dummy payment :",paymentData);

    fetch("http://localhost:5000/api/payments",{
        method:"POST",
        headers:{
            "Content-Type" : "application/json"
        },
        body:JSON.stringify(paymentData)
    })
    .then(function(response){
        return response.json();
    })
    .then(function(result){
        console.log("Dummy payment response :",result);

        if(!result.success){
            throw new Error(result.message || "Payment failed.");
        }

        alert(
            "Dummy Payment Successfully! \n\n" +
        "Payment ID :" + result.data.paymentId + "\n" +
    "Amount : ₹" + Number(result.data.amount).toLocaleString("en-IN"));

    loadPaymentDetails();
    loadPaymentHistory();
    })
    .catch(function(error){
        console.error("Dummy payment error :",error);
        alert("Payment failed.\n\n"+ error.message);
    });
};
}

