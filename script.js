(function (){
    emailjs.init({
        publicKey:"Inq0eP-okC-q4bqqp"
    });
})();

const heroBackground=document.querySelector(".hero-bg");
window.addEventListener("scroll",()=>{
    const scrollPosition=window.scrollY;
heroBackground.style.transform=`translateY(${scrollPosition * 0.35}px)`;
}); 

// work filter //

const filterButtons=document.querySelectorAll(".filter-btn");

filterButtons.forEach(function(button){
    button.addEventListener("click",function(){
        const filter=button.getAttribute("data-filter");

        // active button
        filterButtons.forEach(function(btn){
            btn.classList.remove("active");
        });
button.classList.add("active");

// GET ALL PROJECT CARDS
const projectCards=document.querySelectorAll("#portfolioProjects .project-card");


// Projects filter
projectCards.forEach(function(card){
    const category=card.getAttribute("data-category");
    if (
        filter ==="all" ||
        category === filter
    ){
        card.style.display="";
    }else{
        card.style.display="none";
         }
       });
    });
});

// ======================================================
// LOAD PORTFOLIO PROJECTS FROM ADMIN
// =====================================================

async function loadVisitorPortfolio(){
    const portfolioContainer=document.getElementById("portfolioProjects");

    if(!portfolioContainer){
        return;
    }
    try{
        const response=await fetch(
            "http://localhost:5000/api/portfolio"
        );
        if(!response.ok){
            throw new Error("HTTP Error :" + response.status);
        }
        const result=await response.json();

        if(!result.success || !Array.isArray(result.data)){
            return;
        }
        result.data.forEach(function(project){
            const card=document.createElement("div");
            card.className="project-card";

            // PROJECT CATEGORY
            let category="coding";

            const projectType=(project.projectType || "").toLowerCase();

            if(projectType.includes("video") || projectType.includes("editing")){
                category="video";
            }else if(
                projectType.includes("website") || projectType.includes("web")
        ){
            category="website";
        }
        else if(projectType.includes("coding") || projectType.includes("code")){
            category="coding";
        }
        card.setAttribute("data-category",category);

        // TECHNOLOGIES
        let technologies="";

        if(Array.isArray(project.technologies)){
            technologies=project.technologies.map(function(technology){
                return `<span>${technology}</span>`;
            }).join("");
        }else if(project.technologies){
            technologies=project.technologies.split(",").map(function(technology){
                return `<span>${technology.trim()}</span>`;
            }).join("");
        }

        // IMAGE

        const imageHTML=project.image ? `
        <div class="project-image">
        <img src="${project.image}" alt="${project.projectName || "Portfolio Project"}">
        </div>
        ` : "";

        // LIVE LINK

        const liveLink=project.liveUrl ? `
        <a href="${project.liveUrl}" target="_blank" rel="noopener" class="project-link">View Live → </a> ` : "";

        // GITHUB LINK
        const githubLink=project.githubUrl ?`
        <a href="${project.githubUrl}" target="_blank" rel="noopener" class="project-link"> GitHub → </a>
        ` : "";

        card.innerHTML=`
        ${imageHTML}
        <div class="project-info">
        <p class="project-category">${(project.projectType || "PROJECT").toUpperCase()}</p>

        <h3>${project.projectName || "Untitled Project"}</h3>

        <p>${project.description || ""} </p>
        ${
            technologies ? `
            <div class="project-tags">${technologies}</div>
            ` : ""
        }
        <div class="project-actions">${liveLink} ${githubLink} </div>
        </div>
        `;

        portfolioContainer.appendChild(card);


        });
    }catch(error){
        console.error("Visitor portfolio loading error :",error);
    }
}

// =====================================================
// LOAD PORTFOLIO WHEN WEBSITE OPENS
// ====================================================

loadVisitorPortfolio();

// LIVE CHAT

const chatButton=document.getElementById("chatButton");
const chatBox=document.querySelector(".chat-box");
const chatClose=document.querySelector(".chat-close");
const chatInput=document.getElementById("chatInput");
const chatSend=document.getElementById("chatSend");
const chatMessage=document.getElementById("chatMessages");

// CHAT CONVERSATION STATE
let chatStep="normal";
let projectType="";
let projectDetails="";
let clientName="";
let contactDetails="";
let budget="";
let deadline="";
let projectStatus = "New";

// SEND PROJECT DETAIL TO EMAIL
function sendProjectEmail(){
    console.log("SEND PROJECT EMAIL FUNCTION CALLED");

    const lead={
        clientName:clientName,
        projectType:projectType,
        projectDetails:projectDetails,
        contactDetails:contactDetails,
        budget:budget,
        deadline:deadline,
        status:projectStatus
    };
    console.log("Complete lead:",lead);

    fetch("http://localhost:5000/api/leads",{
        method:"POST",
        headers:{
            "content-Type":"application/json"
        },
        body:JSON.stringify(lead)
    })
    .then(function(response){
        console.log("Backend response status :",response.status);

        if(!response.ok){
            throw new Error("Backend HTTP Error :"+response.status);
        }
        return response.json();
    })
    .then(function(data){
        console.log("Lead saved in backend successfully!",data);
    })
    .catch(function(error){
        console.log("Backend lead save failed :",error);
    });

   
}

// ================================================
// CLIENT PROJECT DATA
// ================================================
let clientVerified=false;
let clientData=null;
let clientVerificationPending=false;

// GET CLIENT DATA BY IDENTIFICATION DETAILS

async function identifyClient(details) {
    try{
        const response= await fetch(
            "http://localhost:5000/api/client-identify",{
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                body:JSON.stringify(details)
            }
        );

        const result=await response.json();
          
         if(result.success){
            clientVerified=true;
            clientData=result.data;
            clientVerificationPending=false;

            console.log("CLIENT VERIFIED :",clientData);

            return result;
        }
        return result;
    }catch(error){
        console.log("Client identification error :",error);
        return {
            success:false,
            message:"Unable to verify client right now."
        };
    }
}

// FIND IDENTIFICATION DETAILS FROM CLIENT MESSAGE
function extractClientDetails(message){
    const details={};

    // EMAIL
    const emailMatch=message.match(
        /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
    );

    if(emailMatch){
        details.email=emailMatch[0];
    }
    
    // MOBILE NUMBER
    const mobileMatch=message.match(
        /(?:\+91[\s-]?)?[6-9]\d{9}/
    );

    if(mobileMatch){
        details.mobile=mobileMatch[0];
    }

    // PAYMENT ID
    const paymentIdMatch=message.match(
        /\bPAY-\d+\b/i
    );

    if(paymentIdMatch){
        details.paymentId=paymentIdMatch[0];
    }

    // TRANSACTION ID
    const transactionMatch=message.match(
        /\b(?:TEST|TXN)[\s-]*[A-Z0-9-]+\b/i
    );

    if(transactionMatch){
        details.transactionId=transactionMatch[0];
    }
    console.log("EXTRACTED CLIENT DETAILS :",details);
    return details;
}
   

// OPEN CHAT

chatButton.addEventListener("click",function(){
    chatBox.style.display="flex";
});

// CLOSE CHAT

chatClose.addEventListener("click",function(){
    
    chatBox.style.display="none";
});

// SEND MESSAGE

chatSend.addEventListener("click",function () {
    sendMessage();

});

// PRESS ENTER TO SEND

chatInput.addEventListener("keypress",function (event){
    if (event.key === "Enter"){
        sendMessage();
    }
});

async function sendMessage(){
    
    
    const message=chatInput.value.trim();

    if (message === ""){
        return;
    }

    // SHOW USER MESSAGE
    const userMessage=document.createElement("div");
    userMessage.classList.add("user-message");

    userMessage.textContent=message;

    chatMessage.appendChild(userMessage);

    // CLEAR INPUT

    chatInput.value="";

    // Smart Multi-Language Reply

    setTimeout(async function (){
        const botMessage=document.createElement("div");
         botMessage.classList.add("bot-message");

         const text=message.toLowerCase();

         const details=extractClientDetails(message);

         // ALLOW NEW CLIENT TO START HIRING WITHOUT VERIFICATION

         if(
            text === "hire"|| 
            text === "hire me" || 
            text.includes("work with you") 
         ){
            chatStep ="project";
            clientVerified=false;
            clientData=null;
            clientVerificationPending=false;
         

         botMessage.textContent="Great! I' d love to work with you. what type of project do you need. website, video editing, or coding ?";

         chatMessage.appendChild(botMessage);
         chatMessage.scrollTop=chatMessage.scrollHeight;
         return;
    }
//=========================================================
// CLIENT PROVIDED EMAIL / MOBILE / PAYMENT ID / TRANSACTION ID
//=========================================================

if(
    text !== "hire" && 
    text !== "hire me" &&
    !text.includes("work with you")  
    ){
        chatStep="project";
        
        botMessage.textContent="Great! I'd love to work with you. What type of project do you need : website, video editing, or coding ?";
} else if(chatStep === "project"){
    if(
        text.includes("website") ||
        text.includes("web") ||
        text.includes("વેબસાઈટ") ||
        text.includes("वेबसाइट")
    ){
        projectType="website";
        chatStep="websiteDetails";
        botMessage.textContent="Perfect ! What kind of website do you need : Business website, Portfolio, E-commerce, or something else?";
    }else if(
        text.includes("video") ||
        text.includes("editing") ||
        text.includes("reel") ||
        text.includes("वीडियो") ||
        text.includes("વિડિઓ")
    ){
        projectType="video Editing";
        chatStep = "videoDetails";
        botMessage.textContent="Awesome! What type of video do you need: Reel, YouTube video, promotional video,or short video?";

    }else if(
        text.includes("coding")  ||
        text.includes("code") ||
        text.includes("programing")
    ){
        projectType="coding";
        chatStep="codingDetails";
        botMessage.textContent="Great! What type of coding project do you need? Please tell me a little about your idea.";
    }else{
        botMessage.textContent="Please choose website, video editing, or coding.";
    }
}
//=========================================================
// CLIENT PROJECT / PAYMENT QUESTIONS
//=========================================================


if(chatStep === "normal"){
   
    if(clientData && clientVerified){
        
        // CLIENT REVIEW REQUEST
        if(
            text.includes("review") ||
            text.includes("feedback") ||
            text.includes("suggestion")
        ){
            if(!clientVerified || !clientData){
                botMessage.textContent="Please verify client details first.";

                chatMessage.appendChild(botMessage);
                chatMessage.scrollTop=chatMessage.scrollHeight;

                return;
            }

            const workProgress=Number(clientData.workProgress || 0);

            if(workProgress <100){
                botMessage.textContent="Your project is not completed yet. You can submit a review and suggestion after your project is completed.";

                chatMessage.appendChild(botMessage);
                chatMessage.scrollTop=chatMessage.scrollHeight;

                return;
            }

            botMessage.textContent="Your project is completed. Please use the Review & Suggestion form below to share your experience";

            chatMessage.appendChild(botMessage);
            chatMessage.scrollTop=chatMessage.scrollHeight;

            showClientReviewSection();

            return;
        }
        
        // PROJECT PROGRESS
        if(
            text.includes("progress") ||
            text.includes("status") || 
            text.includes("complete") ||
            text.includes("completed") ||
            text.includes("કેટલું કામ") ||
            text.includes("પ્રોગ્રેસ")
        ){
            botMessage.textContent="Your project progress is currently" + clientData.workProgress + "%.";

            chatMessage.appendChild(botMessage);
            chatMessage.scrollTop=chatMessage.scrollHeight;

            return;

            // TOTAL PROJECT AMOUNT
        }else if(
            text.includes("total amount") ||
            text.includes("project amount") ||
            text.includes("total price") ||
            text.includes("કુલ રકમ") ||
            text.includes("કેટલા રૂપિયા")
        ){
            botMessage.textContent="Your total project amount is ₹ "+ clientData.totalProjectAmount + ".";

            chatMessage.appendChild(botMessage);
            chatMessage.scrollTop=chatMessage.scrollHeight;

            return;

           
            // PAID AMOUNT

        }else if (
            text.includes("paid") ||
            text.includes("payment done") ||
            text.includes("how much paid") ||
            text.includes("ચૂકવ્યા") ||
            text.includes("ચુકવણી કરી")
        ){
            botMessage.textContent="You have paid ₹" + clientData.totalPaid + " so far.";

            
            chatMessage.appendChild(botMessage);
            chatMessage.scrollTop=chatMessage.scrollHeight;

            return;

            // REMAINING AMOUNT
        }else if(
            text.includes("remaining") ||
            text.includes("due") ||
            text.includes("balance") ||
            text.includes("બાકી") ||
            text.includes("બાકીની રકમ")
        ){
            botMessage.textContent="Your remaining amount is ₹" + clientData.remainingAmount + ".";

            chatMessage.appendChild(botMessage);
            chatMessage.scrollTop = chatMessage.scrollHeight;

            return;


            // PROJECT TYPE
        }else if(
            text.includes("project type") ||
            text.includes("which project") ||
            text.includes("મારો પ્રોજેક્ટ") ||
            text.includes("પ્રોજેક્ટ કયો")
        ){
            botMessage.textContent="Your project type is "+clientData.projectType + ".";

            chatMessage.appendChild(botMessage);
            chatMessage.scrollTop = chatMessage.scrollHeight;

            return;

            // PAYMENT HISTORY
        }else if(
            text.includes("last payment") ||
            text.includes("latest payment") ||
            text.includes("most recent payment")  ||
            text.includes("છેલ્લી ચુકવણી") ||
            text.includes("છેલ્લું પેમેન્ટ ")
        ){
            if(!clientData.payments || clientData.payments.length === 0){
                botMessage.textContent=" No payment history is available yet. ";
            }else{
                const lastPayment=clientData.payments[clientData.payments.length - 1];

                botMessage.textContent= " Your last payment details:\n\n " + "Payment ID : " + lastPayment.paymentId + "\n" +
                "Amount : ₹ " + lastPayment.amount + "\n" +
                "Status : " + lastPayment.paymentStatus + "\n" +
                "Date : " + new Date(lastPayment.paymentDate).toLocaleDateString();
            }
            chatMessage.appendChild(botMessage);
            chatMessage.scrollTop=chatMessage.scrollHeight;

            return;

        }
        else if(
            text.includes("payment history") ||
            text.includes("payments") ||
            text.includes("payment details") ||
            text.includes("ચુકવણીનો ઇતિહાસ") ||
            text.includes("પેમેન્ટ હિસ્ટ્રી")
        ){
            if(clientData.payments.length === 0){
                botMessage.textContent="No payment history is available yet.";
            }else{
                let history = "Your payment history:\n\n";

                clientData.payments.forEach(function(Payment){
                    history 
                    +=
                    "Payment ID :" + Payment.paymentId +
                    "\nAmount : ₹ " + Payment.amount +
                    "\nStatus : " + Payment.paymentStatus +
                    "\nDate : " +new Date(Payment.paymentDate).toLocaleDateString() +
                    "\n\n";
                });
                botMessage.textContent=history;
            }
            chatMessage.appendChild(botMessage);
            chatMessage.scrollTop = chatMessage.scrollHeight;

            return;
            // PAYMENT STATUS
        }else if(
            text.includes("payment status") ||
            text.includes("payment pending") ||
            text.includes("payment paid") ||
            text.includes("પેમેન્ટ સ્ટેટસ") ||
            text.includes("ચુકવણીની સ્થિતિ")
        ){
            botMessage.textContent=" You have paid ₹ " + clientData.totalPaid + " out of ₹ " + clientData.totalProjectAmount + " Remaining Amount is ₹ " + clientData.remainingAmount + ".";

            chatMessage.appendChild(botMessage);
            chatMessage.scrollTop = chatMessage.scrollHeight;

            return;
        }
    }

}

         // ================================================
         // HIRE FLOW
         // ================================================

         if(text.includes("hire")||
        text.includes("work with you")||
    text.includes("hire me")
){
    chatStep="project";
    botMessage.textContent="Great! i'd love to work with you what type of project do you need ? website, video editing, coding or something else ?";

    // =========================================================
    // PROJECT TYPE
    // =========================================================
   }else if(chatStep==="project"){
    if(text.includes("website")||
       text.includes("web")||
       text.includes("વેબસાઈટ")||
       text.includes("वेबसाइट")
){
    projectType="website";
    chatStep="websiteDetails";

    botMessage.textContent="Perfect! what kind of website do you need? For example, Business website, Portfolio, E-commerce or something else?";
}else if(
    text.includes("video")||
    text.includes("editing")||
    text.includes("reel")||
    text.includes("वीडियो")||
    text.includes("વિડિઓ")
){
    projectType="video Editing";
    chatStep="videoDetails";

    botMessage.textContent="Awesome! what type of video do you need? for example, Reel, youtube video, promotional video or short video?";
}else if(
    text.includes("coding")||
    text.includes("code")||
    text.includes("कोडिंग")||
    text.includes("કોડિંગ")
){
    projectType="coding";
    chatStep="codingDetails";

    botMessage.textContent="Great! what type of coding project do you need ? Please tell me a little about your idea.";


}else{
    botMessage.textContent="No Problem! Please tell me whether you need a website, video editing or coding project.";

// =============================================================
// WEBSITE DETAIL
// =============================================================
}
}
else if(chatStep==="websiteDetails"){
    console.log("WEBSITE DETAILS STEP REACHED");
    console.log("Website Details :",message);
    projectDetails=message;
    chatStep="contact";

    botMessage.textContent="Great! Your website requirements are saved. Do you have any other pages or features you need?";

    // =========================================================
    // VIDEO DETAILS
    // =========================================================

    }else if(chatStep==="videoDetails"){

        console.log("VIDEO DETAILS STEP REACHED");
        projectDetails=message;
        chatStep="contact";

        botMessage.textContent="Awesome! Your video requirments are saved. Please tell me the duration and editing style you need.";

    // =========================================================
    // CODING DETAILS
    // =========================================================
}else if (chatStep==="codingDetails"){

    console.log("CODING DETAILS STEP REACHED");
    projectDetails=message;
    chatStep="contact";

    botMessage.textContent="Sound good! Your coding project details are saved. Do you have any etra features in mind?";

    // ==========================================================
    // CONTACT / PROJECT DETAILS 
    // ASK CLIENT NAME
    // ==========================================================
}else if(chatStep==="contact"){
    
    chatStep="name";

    botMessage.textContent="Thanks! Your project details are noted. May I know your name?";
// ==============================================================
// SAVE CLIENT NAME
// ==============================================================
}else if (chatStep === "name"){
    clientName = message;
    chatStep = "contactDetails";

    botMessage.textContent="Nice to meet you." + clientName + "!Please share your email address or whatsapp number.";

// ==============================================================
// SAVE CONTACT DETAILS AND SEND EMAIL
// ==============================================================
}else if (chatStep==="contactDetails"){
    
    contactDetails=message;
    
    console.log("FINAL CONTACT STEP REACHED");
    console.log("client name :",clientName );
    console.log("Project type :" ,projectType);
    console.log("project Details :",projectDetails);
    console.log("Contact Details :", contactDetails );

    // SEND DETAIL TO EMAIL
    
    chatStep="budget";

    botMessage.textContent="Thanks! What is your estimated budget for this project?";

    // =========================================================
    //  BUDGET 
    // =========================================================
} else if(chatStep === "budget"){
    budget = message;
    chatStep="deadline";

    botMessage.textContent="Great! When do you need this project completed?";

    // ==========================================================
    // DEADLINE
    // ==========================================================

}else if(chatStep==="deadline"){
    deadline=message;
    
    sendProjectEmail();
    chatStep="normal";

    botMessage.textContent="Thank you,"+ clientName + "! Your complete project inquiry has been received. I will contact you soon.";
    // ==========================================================
    // GUJARATI
    // ==========================================================
} else if(text.includes("કેમ છો")||
          text.includes("મદદ")||
          text.includes("જોઈએ")
        ){
            botMessage.textContent="નમસ્તે! 👋🏼 હું તમારી મદદ કરવા માટે અહીં છું. તમે વેબસાઈટ, વિડિઓ, વિડિઓ એડિટિંગ અથવા પ્રોજેક્ટ વિશે પૂછી શકો છો."


    // ==========================================================
    // HINDI
    // ==========================================================

}else if(text.includes("मुझे")||
          text.includes("चाहिए")||
          text.includes("मदद")){

           botMessage.textContent="नमस्ते, मैं आपकी मदद करने के लिए यहाँ हूँ। आप वेबसाइट, वीडियो, वीडियो एडिटिंग या प्रोजेक्ट्स के बारे में पूछ सकते हैं ।"; 
          
    // ==========================================================
    // ENGLISH GREETING
    // ==========================================================
        } else if(text==="hi"||
            text==="hello"||
            text==="hey"
        ){
            botMessage.textContent="Hi! 👋 How can I help you today?";

        // ======================================================
        // WEBSITE
        // ======================================================
        } else if(
            text.includes("website")||
            text.includes("web")
        ){
            botMessage.textContent="Sure! I can help you create a professional and responsive website for your business.";

        // ======================================================
        // VIDEO
        // ======================================================

        }else if(text.includes("video")||
    text.includes("editing")||
text.includes("reel")
){
    botMessage.textContent="Absolutely! I provide video editing for reels, shorts, promotional videos and social media content.";

    // ===========================================================
    // DEFAULT
    // ===========================================================
}else{
    botMessage.textContent="Thanks for your message! Please tell me a little more about what you need.";
}

// ADD BOT MESSAGE

chatMessage.appendChild(botMessage);

// SCROLL TO LATEST MESSAGE
chatMessage.scrollTop=chatMessage.scrollHeight;
    }, 800);
}

// ========================================================
// CLIENT REVIEW & SUGGESTION
// ========================================================

function showClientReviewSection(){
    const reviewSection=document.getElementById("clientReviewSection");

    if(!reviewSection){
        return;
    }

    // Client must be verified
    if(!clientVerified || !clientData){
        reviewSection.style.display="none";
        return;
    }
    // Project must be completed

    const workProgress=Number(clientData.workProgress || 0);

    if(workProgress <100){
        reviewSection.style.display="none";
        return;
    }
    reviewSection.style.display="block";

    reviewSection.scrollIntoView({
        behavior:"smooth",
        block:"start"
    });

    // Client Name
    const clientNameInput=document.getElementById("reviewClientName");

    if(clientNameInput){
        clientNameInput.value=clientData.clientName || "";
    }

    loadClientReviewProjects();
}

// ========================================================
// LOAD CLIENT'S PROJECTS
// ========================================================

async function loadClientReviewProjects(){
    const projectSelect=document.getElementById("reviewProjectId");

    if(!projectSelect){
        return;
    }
    try{
        const response=await fetch(
            "http://localhost:5000/api/portfolio"
        );

        if(!response.ok){
            throw new Error("HTTP Error :"+ response.status);
        }

        const result=await response.json();

        if(!result.success || !Array.isArray(result.data)){
            return;
        }

        projectSelect.innerHTML='<option value="">Select your Project </option>';

        result.data.forEach(function(project){
            const option=document.createElement("option");
            option.value=project.id;

            option.textContent=project.projectName || "Project" ;

            projectSelect.appendChild(option);
        });
    }
    catch(error){
        console.error("Review project loading error :",error);
    }
}

// ========================================================
// SUBMIT CLIENT REVIEW
// ========================================================

const clientReviewForm=document.getElementById("clientReviewForm");

if(clientReviewForm){
    clientReviewForm.addEventListener("submit",async function(event){

        // stop normal form submission
        event.preventDefault();
        event.stopPropagation();

        // client verification check
        if(!clientVerified || !clientData){
            alert("please verify your client details first.");

            return;
        }

        const projectId=document.getElementById("reviewProjectId").value;

        const rating=Number(document.getElementById("reviewRating").value);

        const review=document.getElementById("reviewText").value.trim();

        const suggestion=document.getElementById("reviewSuggestion").value.trim();

        const message=document.getElementById("reviewMessage");

        // validation

        if(!projectId){
            message.textContent="Please select your project.";

            return;
        }

        if(!rating){
            message.textContent="Please select a rating.";
            return;
        }

        if(!review){
            message.textContent="Please write your review.";
            return;
        }

        try{
            const response=await fetch(
                "http://localhost:5000/api/reviews",{
                    method:"POST",
                    headers:{
                        "Content-Type" : "application/json"
                    },

                    body:JSON.stringify({
                        projectId:Number(projectId),
                        leadNumber:Number(clientData.leadNumber),
                        clientName:clientData.clientName,
                        rating:rating,
                        review:review,
                        suggestion:suggestion

                    })
                }
            );

            const result=await response.json();
if(!response.ok || !result.success){
    alert(
        result.message || "Review could not be submitted."
    );
    return;
}
alert(
    "Thank you! your review and suggestion have been submitted successfully."
);

clientReviewForm.reset();

document.getElementById("reviewClientName").value=clientData.clientName || "";
        }

        catch(error){
            console.error("Client review submit error :",error);

            alert("Server connection error. Please try again.");
        }
    });
}

// ==========================================================
// LOAD APPROVED CLIENT REVIEWS
// =========================================================

async function loadPubliceReview(){
    const reviewsContainer=document.getElementById("publicReviewsContainer");

    if(!reviewsContainer){
        return;
    }
    try{
        reviewsContainer.innerHTML="<p>Loading Reviews...</p>";

        const response=await fetch("http://localhost:5000/api/reviews");

        const result=await response.json();

        if(!response.ok || !result.success){
            reviewsContainer.innerHTML="<p>Reviews could not be loaded. </p>";

            return;
        }
        const reviews=Array.isArray(result.data)? result.data:[];

        if(reviews.length === 0){
            reviewsContainer.innerHTML="<p>No reviews available yet. </p>";

            return;
        }

        reviewsContainer.innerHTML="";

        reviews.forEach(function(review){
            const reviewCard=document.createElement("div");

            reviewCard.className="public-review-card";

            const rating=Number(review.rating || 0);

            reviewCard.innerHTML=`<div class="public-review-rating">${"★".repeat(rating)} ${"☆".repeat(5 - rating)} </div>
            <h3>${review.clientName || "client"} </h3>
            <p>${review.review || ""} </p>
            `;

            reviewsContainer.appendChild(reviewCard);
        });
    }
    catch(error){
        console.error("Public reviews loading error :",error);

        if(reviewsContainer){

            reviewsContainer.innerHTML="<p>Unable to load client reviews. </p>";
        }

        
    }
}

// LOAD APPROVED REVIEWS WHEN WEBSITE OPENS
loadPubliceReview();