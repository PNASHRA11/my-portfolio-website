
// ADMIN PAGE PROTECTION
const isLoggedIn=localStorage.getItem("adminLoggedIn");
if (isLoggedIn !== "true"){
    window.location.href="admin_login.html";
}

// LOGOUT
const logoutBtn=document.getElementById("logoutBtn");

if(logoutBtn){
    logoutBtn.addEventListener("click",function(){
        localStorage.removeItem("adminLoggedIn");

        window.location.href="admin_login.html";
    });
}



// LEAD MANAGEMENT
let currentSearchText="";

// DISPLAY SAVED LEADS
async function displaySavedLeads(){
    const leadsContainer=document.getElementById("leadsContainer");

    const totalLeadsElement=document.getElementById("totalLeads");

    if(!leadsContainer){
        console.log("Leads container not found.");
        return;
    }
    try{
        const response=await fetch("http://localhost:5000/api/leads");

        if(!response.ok){
            throw new Error("HTTP Error :" + response.status);

        }

        const result = await response.json();
        const savedLeads=result.data;

        if(!Array.isArray(savedLeads) || savedLeads.length === 0){
            leadsContainer.innerHTML='<p class="no-leads">No Client Leads Found.</p>';

            if(totalLeadsElement){
                totalLeadsElement.textContent="0";
            }
            return;
        }

        if(totalLeadsElement){
            totalLeadsElement.textContent=savedLeads.length;
        }

        // SEARCH : original backend indexes remain unchanged

        const filteredLeads=savedLeads.map(function(lead,index){
            return{
                lead:lead,
                originalIndex:index
            };
        })

        .filter(function(item){
            const lead= item.lead;

            const searchableText=`
            ${lead.leadNumber || ""}
            ${lead.clientName || ""}
            ${lead.projectType || ""}
            ${lead.projectDetails || ""}
            ${lead.contactDetails || ""}
            ${lead.budget || ""}
            ${lead.deadline || ""}
            ${lead.status || ""}
            `.toLowerCase();

            return searchableText.includes(currentSearchText.toLowerCase().trim());
        }).reverse();

        if(filteredLeads.length === 0){
            leadsContainer.innerHTML='<p class="no-leads">No Matching Leads Found. </p>';

            return;
        }

        // CREATE TABLE
        leadsContainer.innerHTML=`
        <div style="width:100%; overFlow-x:auto;"> 
        <table style="width:100%; border-collapse:collapse;">
        <thead>
        <tr>
        <th>Lead</th>
        <th>Client Name</th>
        <th>Project Type</th>
        <th>Status</th>
        <th>Action</th>
        </tr>
        </thead>
        <tbody id="leadsTableBody"></tbody>
        </table>
        </div>
        `;

        const tableBody=document.getElementById("leadsTableBody");

        // NEWEST LEAD FIRST
        filteredLeads.forEach(function(item){
            const lead=item.lead;
            const originalIndex=item.originalIndex;

            const row=document.createElement("tr");
            const detailsRow=document.createElement("tr");

            row.innerHTML=`
            <td></td>
            <td></td>
            <td></td>

            <td>
            <select class="lead-status" data-index="${originalIndex}">
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Rejected">Rejected</option>
            </select>
            </td>
            <td>
            <button type="button" class="view-lead-details">View Details </button>

            <button type="button" class="delete-lead" data-index="${originalIndex}">Delete Lead </button>
            </td>
            `;

            row.cells[0].textContent="Lead" + (lead.leadNumber || originalIndex + 1);

            row.cells[1].textContent = lead.clientName || "Not Provided";
            row.cells[2].textContent=lead.projectType || "Not Provided";

            const statusSelect=row.querySelector(".lead-status");

            const allowedStatuses=[
                "New",
                "Contacted",
                "In Progress",
                "Completed",
                "Rejected"
            ];

            statusSelect.value=allowedStatuses.includes(lead.status)? lead.status : "New";

            // DETAILS ROW
            detailsRow.hidden=true;
            detailsRow.className="lead-details-row";

            const detailsCell=document.createElement("td");
            detailsCell.colSpan=5;

            const received=document.createElement("p");
            received.textContent="received :" + (lead.createdAt ? new Date(lead.createdAt).toLocaleString("en-IN") : "Date not available");
            
            const projectDetails=document.createElement("p");
            projectDetails.textContent="Project Details :" + (lead.projectDetails || "Not Provided");

            const contact=document.createElement("p");
            contact.textContent="Contact :" + (lead.contactDetails || "Not Provided");

            const budget=document.createElement("p");
            budget.textContent="Budget :" + (lead.budget || "Not Provided");

            const paid=document.createElement("p");
            paid.textContent="Paid Amount: ₹ " + (lead.paidAmount || 0);
            
            const remaining=document.createElement("p");
            remaining.textContent = "Remaining : ₹ " + (lead.remainingAmount || 0);

            const paymentStatus=document.createElement("p");
            paymentStatus.textContent="Payment Status :" + (lead.paymentStatus || "pending");

            const deadline=document.createElement("p");
            deadline.textContent="Deadline :" + (lead.deadline || "Not Provided");

            const work=document.createElement("p");
            work.textContent="Work Progress :" + Number(lead.workPercentage || 0) + "%";

            const progressLabel=document.createElement("label");
            progressLabel.textContent="update Work Progress: ";

            const progressInput=document.createElement("input");
            progressInput.type ="number";
            progressInput.className="work-progress";
            progressInput.dataset.index=originalIndex;
            progressInput.min="0";
            progressInput.max="100";
            progressInput.placeholder = "0";

            progressLabel.appendChild(progressInput);

            const percent=document.createElement("span");
            percent.textContent="%";

            const saveProgress=document.createElement("button");
            saveProgress.type="button";
            saveProgress.className="save-work-progress";
            saveProgress.dataset.index=originalIndex;
            saveProgress.textContent="Save Work Progress";

            detailsCell.append(
                received,
                projectDetails,
                contact,
                budget,
                paid,
                remaining,
                paymentStatus,
                deadline,
                work,
                progressLabel,
                percent,
                saveProgress
            );

            detailsRow.appendChild(detailsCell);

            const detailsButton=row.querySelector(".view-lead-details");

            detailsButton.addEventListener("click",function(){
                detailsRow.hidden=!detailsRow.hidden;
                detailsButton.textContent=detailsRow.hidden ? "View Details " : "Hide Details";
            });

            tableBody.appendChild(row);
            tableBody.appendChild(detailsRow);
        });
    }catch(error){
        console.error("Failed to load leads :", error);
        leadsContainer.innerHTML='<p class="no-leads">Unable to load leads from backend. Check if the server is running.</p>';

    }
}

// DELETE LEAD
async function deleteLead(index){
    const confirmDelete=confirm("Are you sure you want to delete this lead ?");
    if(!confirmDelete){
        return;
    }
    try{
        const response=await fetch("http://localhost:5000/api/leads/"+index,{
            method : "DELETE"
        });
        if (!response.ok){
            throw new Error("HTTP Error :"+response.status);
        }
        const result=await response.json();
        console.log("Lead deleted :",result);
        
        //REFRESH LEADS
        displaySavedLeads();
    }catch(error){
        console.error("Failed to delete lead :",error);
        alert("Lead delete failed Please try again.");
    }

}
// DELETE BUTTON CLICK

document.addEventListener("click",function(event){
    if(event.target.classList.contains("delete-lead")){
        const index=Number(event.target.getAttribute("data-index"));
        deleteLead(index);
    }
});

// UPDATE LEAD STATUS
async function updateLeadStatus(index,newStatus) {
    try{
        const response=await fetch("http://localhost:5000/api/leads/"+ index,{
            method: "PATCH",
            headers : {
                "Content-Type" : "application/json"
            },
            body : JSON.stringify({
                status:newStatus
            })
        });

        if(!response.ok){
            throw new Error("HTTP Error :"+response.status);
        }
        const result=await response.json();

        console.log("Lead status updated :",
            result
        );
        displaySavedLeads();
    }catch(error){
        console.error("Failed to update lead status:",
            error
        );
    }
}

// STATUS CHANGE

document.addEventListener("change",function(event){
    if(event.target.classList.contains("lead-status")){
        const index=Number(event.target.getAttribute("data-index"));

        const newStatus=event.target.value;

        updateLeadStatus(index,newStatus);
    }
});

const leadSearch=document.getElementById("leadSearch");

if(leadSearch){
    leadSearch.addEventListener("input",function(){
        currentSearchText=leadSearch.value.toLocaleLowerCase().trim();

        displaySavedLeads();
    });
}
// =====================================================
// ADMIN SETTINGS
// =====================================================

document.addEventListener("click",function(event){
    if(event.target.classList.contains("save-work-progress")){
        const index=Number(event.target.getAttribute("data-index"));
        
        console.log("PATCH INDEX =",index);
        console.log("PATCH URL =","http://localhost:5000/api/leads/"+index);
        
        const Input=document.querySelector(`.work-progress[data-index="${index}"]`);
        
        const workPercentage=Number(Input.value);
        
        if(workPercentage <0 || workPercentage > 100){
            alert("Work progress must be between 0 and 100.");
            return;
        }
       
        fetch("http://localhost:5000/api/leads/"+index,{
            method:"PATCH",
            headers:{
                "content-Type":"application/json"
            },
            body:JSON.stringify({
                workPercentage:workPercentage
            })
        })
        .then(function(response){
            if(!response.ok){
                throw new Error("HTTP Erro :"+ response.status);
            }
            return response.json();
        })
        .then(function(result){
            console.log("work progress updated :",result);

            if(result.success){
                alert("work progress updated successfully!");

            displaySavedLeads();

            setTimeout(function(){
                const updatedInput=document.querySelector(`.work-progress[data-index ="${index}"]`);

                if(updatedInput){
                    updatedInput.value="";
                }
            },0);
            }
            
        })
        .catch(function(error){

            console.log("WORK PROGRESS ERROR TYPE :",typeof error);
            console.log("WORK PROGRESS ERROR :",error);
            console.log("WORK PROGRESS ERROR MESSAGE :",error.message);

            alert("Work Progress Error :" + error.message);
        });
    }
});


// =====================================================
// ADMIN SETTINGS
// =====================================================

const settingsButton=document.getElementById("settingsButton");
if(settingsButton){
    settingsButton.addEventListener("click",function(){
        window.open(
            "admin_setting.html",
            "adminSettings",
            "width=600,height=700,resizeble=yes,scrollbars=yes"
        );
    });
}
// =====================================================
// CHANGE ADMIN ID
// =====================================================

const changeAdminIdButton=document.getElementById("changeAdminIdButton");

if(changeAdminIdButton){
    changeAdminIdButton.addEventListener("click",function(){
        const newAdminId=document.getElementById("newAdminId").value.trim();

        const currentPassword=document.getElementById("currentPasswordForId").value;

        const message=document.getElementById("adminIdMessage");

        if(!newAdminId || !currentPassword){
            message.textContent="Please fill all field.";
            return;
        }

        fetch("http://localhost:5000/api/admin/change-id",{
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                currentPassword:currentPassword,
                newAdminId:newAdminId
            })
        })
        .then(function(response){
            return response.json();
        })
        .then(function(data){
            message.textContent=data.message;

            if(data.success){
                document.getElementById("newAdminId").value="";
                document.getElementById("currentPasswordForId").value="";
            }
        })
        .catch(function(error){
            console.error("Change Admin ID error:",error);
            message.textContent="Server connection error.";
        });
    });
}

// =====================================================
// CHANGE PASSWORD
// =====================================================

const changePasswordButton=document.getElementById("changePasswordButton")
if(changePasswordButton){
    changePasswordButton.addEventListener("click",function(){
        const currentPassword=document.getElementById("currentPassword").value;

        const newPassword=document.getElementById("newPassword").value;

        const confirmPassword=document.getElementById("confirmPassword").value;
        const message=document.getElementById("passwordMessage");

        if(!currentPassword || !newPassword || !confirmPassword){
            message.textContent="Please fill all fields.";
            return;
        }

        if(newPassword !== confirmPassword){
            message.textContent="New password do not match.";
            return;
        }

        fetch("http://localhost:5000/api/admin/change-password",{
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                currentPassword:currentPassword,
                newPassword:newPassword
            })
        })
        .then(function(response){
            return response.json();
        })
        .then(function(data){
            message.textContent=data.message;

            if(data.success){
                document.getElementById("currentPassword").value="";
                document.getElementById("newPassword").value="";
                document.getElementById("confirmPassword").value="";
            }
        })
        .catch(function(error){
            console.error("Change password error :",error);
            message.textContent="Server connection error.";
        });

    });
}

// =====================================================
// PORTFOLIO PROJECTS
// =====================================================

const addPortfolioProjectButton=document.getElementById("addPortfolioProject");

const cancelPortfolioEditButton=document.getElementById("cancelPortfolioEdit");
let editingPortfolioId=null;

if(addPortfolioProjectButton){

    addPortfolioProjectButton.addEventListener("click",async function(){
        const projectName=document.getElementById("portfolioProjectName").value.trim();

        const projectType=document.getElementById("portfolioProjectType").value.trim();

        const description=document.getElementById("portfolioProjectDescription").value.trim();

        const technologies=document.getElementById("portfolioTechnologies").value.trim();

        const image=document.getElementById("portfolioImage").value.trim();

        const liveUrl=document.getElementById("portfolioliveUrl").value.trim();

        const githubUrl=document.getElementById("portfolioGithubUrl").value.trim();

        const status=document.getElementById("portfolioStatus").value;

        const featured=document.getElementById("portfolioFeatured").checked;

        const message=document.getElementById("portfolioMessage");

        if(!projectName){
            message.textContent="Please enter project name.";

            return;
        }
        try{
            const response= await fetch(
                "http://localhost:5000/api/portfolio",{
                    method:"POST",
                    headers:{
                        "Content-Type" : "application/json"
                    },
                    body:JSON.stringify({
                        projectName:projectName,
                        projectType:projectType,
                        description:description,
                        technologies:technologies,
                        image:image,
                        liveUrl:liveUrl,
                        githubUrl:githubUrl,
                        status:status,
                        featured:featured,
                    })
                }
            );

            const result = await response.json();

            if(!response.ok || !result.success){
                message.textContent=result.message || "Project could not be added.";

                return;
            }

            message.textContent="Portfolio project added successfully.";

            // CLEAN FORM

            document.getElementById("portfolioProjectName").value="";

            document.getElementById("portfolioProjectType").value="";

            document.getElementById("portfolioProjectDescription").value="";

            document.getElementById("portfolioTechnologies").value="";

            document.getElementById("portfolioImage").value="";

            document.getElementById("portfolioliveUrl").value="";

            document.getElementById("portfolioGithubUrl").value="";

            document.getElementById("portfolioStatus").value="completed";

            document.getElementById("portfolioFeatured").checked=false;

            loadAdminPortfolio();
        }
        catch(error){
            console.error("Portfolio and error",error);
            
        message.textContent="Server connection error.";
        }
    })
}

// =====================================================
// LOAD ADMIN PORTFOLIO
// =====================================================

async function loadAdminPortfolio() {

    const container=document.getElementById("portfolioProjectsContainer");

    if(!container){
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

        if(!result.success){
            container.innerHTML="<p>Portfolio projects could not be loaded. </p>";

            return;
        }
        if(!Array.isArray(result.data) || result.data.length === 0){
            container.innerHTML="<p>No portfolio projects found. </p>";

            return;
        }

        container.innerHTML="";

        result.data.forEach(function(project){
            
            const card=document.createElement("div");

            card.className="admin-portfolio-card";

            card.innerHTML=`<h3>${project.projectName}</h3>
            <p><strong>Type :</strong>${project.projectType || "-"}</p>
            <p>${project.description || ""} </p>
            <p><strong>Status :</strong>${project.status || "-"}</p>
            ${project.technologies ? `<p><strong>Technologies :</strong> ${Array.isArray(project.technologies)? project.technologies.join(","):project. technologies}</p> ` : " "}
            ${project.liveUrl ? `<p>
                <a href="${project.liveUrl}" target="_blank" >Live Website </a> 
                </p> ` : ""}
            ${
                project.githubUrl ? ` <p> 
                <a href="${project.githubUrl}" target="_blank" rel="noopener noreferrer">
                GitHub </a>
                </p>
                ` : ""
            }
            <button class="edit-portfolio-project" data-id="${project.id}">Edit </button>
            <button class="delete-portfolio-project" data-id="${project.id}">Delete </button>
                `;
            
            container.appendChild(card);
        });
    }

    catch(error){
        console.error("Portfolio loading error:",error);

        container.innerHTML="<p>Server connection error. </p>";
    }
    
}

// =====================================================
// DELETE PORTFOLIO PROJECT
// =====================================================

async function deletePortfolioProject(id){
    const confirmDelete=confirm("Are you sure you to delete this project ?");

    if(!confirmDelete){
        return;
    }
    try{
        const response= await fetch(
            "http://localhost:5000/api/portfolio/" + id,{
                method : "DELETE"
            }
        );

        const result = await response.json();

        if(!response.ok || !result.success){
            alert(result.message || "Project could not be deleted.");

            return;
        }

        loadAdminPortfolio();
    }
    catch(error){
        console.error("Portfolio delete error :",error);

        alert("Server connection error");
    }
}

// =====================================================
// DELETE PORTFOLIO BUTTON
// =====================================================

document.addEventListener("click",function(event){
    if(event.target.classList.contains("delete-portfolio-project")){
        const id=Number(event.target.getAttribute("data-id"));

        deletePortfolioProject(id);
    }
});

// =====================================================
// EDIT PORTFOLIO PROJECT
// =====================================================
document.addEventListener("click",async function(event){
    if(!event.target.classList.contains("edit-portfolio-project")){
        return;
    }
    const id=Number(event.target.getAttribute("data-id"));

    try{
        const response = await fetch(
            "http://localhost:5000/api/portfolio"
        );
        const result=await response.json();

        if(!response.ok || !result.success){
            alert(result.message || " Portfolio projects couls not be loaded");

            return;
        }
        const project=result.data.find(function(item){
            return Number(item.id)===id;
        });

        if(!project){
            alert("Project not found.");
            return;
        }

        // FILL FORM
        document.getElementById("portfolioProjectName").value=project.projectName || "";

        document.getElementById("portfolioProjectDescription").value=project.description || "";

        document.getElementById("portfolioTechnologies").value=Array.isArray(project.technologies)? project.technologies.join(",") : project.technologies || "";

        document.getElementById("portfolioImage").value=project.image || "";

        document.getElementById("portfolioliveUrl").value=project.liveUrl || "";

        document.getElementById("portfolioGithubUrl").value=project.githubUrl || "";

        document.getElementById("portfolioStatus").value=project.status || "completed";

        document.getElementById("portfolioFeatured").checked=project.featured === true;

        // STORE EDIT ID

        editingPortfolioId=id;

        // CHANGE BUTTON TEXT
        addPortfolioProjectButton.textContent="Save Changes";

        if(cancelPortfolioEditButton){
            cancelPortfolioEditButton.style.display="inline-block";
        }

        document.getElementById("portfolioMessage").textContent="Editing portfolio project...";

        // SCROLL TO FORM

        document.getElementById("portfolioAdmin").scrollIntoView({
            behavior:"smooth"
        });

    }
    catch(error){
        console.error("Edit portfolio error :",error);

        alert("Server connection error.");
    }
});

// =====================================================
// CANCEL PORTFOLIO EDIT
// =====================================================
if(cancelPortfolioEditButton){
    cancelPortfolioEditButton.addEventListener("click",function(){
        editingPortfolioId=null;

        document.getElementById("portfolioProjectName").value="";
        document.getElementById("portfolioProjectType").value="";
        document.getElementById("portfolioProjectDescription").value="";
        document.getElementById("portfolioTechnologies").value="";
        document.getElementById("portfolioImage").value="";
        document.getElementById("portfolioliveUrl").value="";
        document.getElementById("portfolioGithubUrl").value="";
        document.getElementById("portfolioStatus").value="";
        document.getElementById("portfolioFeatured").checked=false;

        addPortfolioProjectButton.textContent="Add Portfolio Project";

        cancelPortfolioEditButton.style.display="none";

        document.getElementById("portfolioMessage").textContent="";
    });
}


// =====================================================
// LOAD PORTFOLIO WHEN ADMIN PAGE OPENS
// =====================================================

loadAdminPortfolio();

// =======================================================
// CLIENT REVIEWS - ADMIN
// =======================================================

let currentReviewSearch="";
let currentReviewStatus="all";
let CurrentReviewRating="all";

async function loadAdminReviews(){
    const container=document.getElementById("reviewsContainer");

    if(!container){
        return;
    }
    try{
        const response=await fetch(
            "http://localhost:5000/api/admin/reviews"
        );

        if(!response.ok){
            throw new Error("HTTP Error :"+ response.status);
        }

        const result=await response.json();

        console.log("ADMIN REVIEWS RESPONSE :",result);

        if(!result.success || !Array.isArray(result.data)){
            container.innerHTML = "<p> No client reviews found .</p>";

            return;
        }

// ========================================================
// FILTER REVIEWS
// ========================================================


    const filteredReview=result.data.filter(function(review){

        // SEARCH

        const searchableText=`${review.clientName || ""}
        ${review.projectName || ""}
        ${review.projectType || ""}
        ${review.review || ""}`.toLowerCase();

        if(currentReviewSearch && !searchableText.includes(currentReviewSearch.toLowerCase().trim())){
            return false;
        }

        // STATUS FILTER

        const reviewStatus=String(review.status || "pending").trim().toLowerCase();
        const selectedStatus=String(currentReviewStatus || "all").trim().toLowerCase();

if(selectedStatus !== "all"){
    const normalizedStatus=reviewStatus === "new" ? "pending":reviewStatus;

    const normalizedSelectedStatus=selectedStatus==="new" ? "pending" : selectedStatus;

    if(normalizedStatus !== normalizedSelectedStatus){
        return false;
    }
}

        // RATING FILTER
        if(CurrentReviewRating !== "all" && Number(review.rating) !== Number(CurrentReviewRating)){
            return false;
        }

        return true;

});

console.log("FILTERED REVIEWS :",filteredReview);

// =======================================================
// NO MATCHING REVIEWS
// =======================================================

if(filteredReview.length === 0){
    container.innerHTML="<p>No matching client reviews found. </p>";

    return;
}

// =======================================================
// CLEAR OLD REVIEWS
// =======================================================

container.innerHTML="";

// =======================================================
// DISPLAY REVIEWS
// =======================================================
const wrapper=document.createElement("div");
wrapper.className="review-table-wrapper";

wrapper.innerHTML=`<table class="admin-reviews-table">
<thead>
<tr>
<th>Client Name</th>
<th>Review</th>
<th>Status</th>
<th>Action</th>
</tr>
</thead>
<tbody></tbody>
</table>
`;

container.appendChild(wrapper);

const tableBody=wrapper.querySelector("tbody");

// NEWEST REVIEW FIRST

filteredReview.slice().reverse().forEach(function(review){
    const row=document.createElement("tr");
    const detailsRow=document.createElement("tr");
    const status=String(review.status || "pending").toLowerCase();
    const rating="⭐".repeat(Number(review.rating) || 0);



    row.innerHTML=`
    <td></td>
    <td class="review-preview"></td>
    <td>
    <span class="review-status review-${status}"></span>
    </td>
    <td class="review-actions">
    <button type="button" class="view-review-details">View Details </button>

    <button type="button" class="approve-review" data-project-id="${review.projectId}" data-review-id="${review.id}">Approve</button>

    <button type="button" class="reject-review" data-project-id="${review.projectId}" data-review-id="${review.id}">Reject </button>

    <button type="button" class="delete-review" data-project-id="${review.projectId}" data-review-id="${review.id}">Delete</button>
    </td>
    `;

    // show text safely

    row.cells[0].textContent=review.clientName || "Unknown Client";
    row.querySelector(".review-preview").textContent=review.review || "-";

    row.querySelector(".review-status").textContent=status;

    // DETAILS ROW
    detailsRow.hidden=true;
    detailsRow.className="review-details-row";

    const detailsCell=document.createElement("td");
    detailsCell.colSpan=4;

    const projectName=document.createElement("p");
    projectName.textContent="Project Name :" + (review.projectName || "-");

    const projectType=document.createElement("p");
    projectType.textContent="project Type :" + (review.projectType || "-");

    const reviewRating=document.createElement("p");
    reviewRating.textContent= "Rating :"+(rating || "No rating");

    const reviewDate=document.createElement("p");
    reviewDate.textContent="Date :" + (review.createdAt ? new Date(review.createdAt).toLocaleString("en-IN"):"-");

    detailsCell.append(
        projectName,
        projectType,
        reviewRating,
        reviewDate
    );

    detailsRow.appendChild(detailsCell);

    // VIEW / HIDE DETAILS

    const detailsButton=row.querySelector(".view-review-details");

    detailsButton.addEventListener("click",function(){
        detailsRow.hidden=!detailsRow.hidden;

        detailsButton.textContent=detailsRow.hidden ? "View Details" :"Hide Details";
    });

    tableBody.appendChild(row);
    tableBody.appendChild(detailsRow);
});
 } catch(error){
        console.error("Admin review loading error :",error);

        container.innerHTML="<p>unable to load client reviews. </p>";
    }
}    
// =======================================================
// REVIEW FILTERS
// =======================================================

const reviewSearch=document.getElementById("reviewSearch");

if(reviewSearch){
    reviewSearch.addEventListener("input",function(){
        currentReviewSearch = reviewSearch.value.toLocaleLowerCase().trim();

        loadAdminReviews();
    });
}

const reviewStatusFilter=document.getElementById("reviewStatusFilter");

if(reviewStatusFilter){
    reviewStatusFilter.addEventListener("change",function(){
        currentReviewStatus=String(this.value || "all").trim().toLowerCase();

        loadAdminReviews();
    });
}

const reviewRatingFilter=document.getElementById("reviewRatingFilter");

if(reviewRatingFilter){
    reviewRatingFilter.addEventListener("change",function(){
        CurrentReviewRating= reviewRatingFilter.value;

        loadAdminReviews();
    });
}
// =======================================================
// UPDATE REVIEW STATUS
// =======================================================
async function updateReviewStatus(projectId,reviewId,status){
    try{
        const response=await fetch(
            `http://localhost:5000/api/reviews/${projectId}/${reviewId}`,{
                method:"PATCH",
                headers:{
                    "Content-Type":"application/json"
                },
                body:JSON.stringify({
                    status:status
                })
            }
        );

        const result=await response.json();

        if(!response.ok || !result.success){

            console.error("Review status API error :",result);
            alert(
                result.message || "Review status could not be updated."
            );

            return;
        }

        loadAdminReviews();
    }
    catch(error){
        console.error("Review status updated error :",error);

        alert("Server connection error. ");
    }
}

// =======================================================
// DELETE REVIEW
// =======================================================

async function deleteReview(projectId,reviewId){
    const confirmDelete=confirm(
        "Are you sure you want to delete this review ?"
    );
    if(!confirmDelete){
        return;
    }
    try{
        const response=await fetch(
            `http://localhost:5000/api/reviews/${projectId}/${reviewId}`,
            {
                method:"DELETE"
            }
        );

        const result=await response.json();

        if(!response.ok || !result.success){
            alert(
                result.message || "Review could not be deleted."
            );

            return;
        }
        loadAdminReviews();
    }
    catch(error){
        console.error("Review delete error :",error);
        alert("Server connection error.");
    }

}

// =======================================================
// REVIEW BUTTONS
// =======================================================

document.addEventListener("click",function(event){
    if(event.target.classList.contains("approve-review")){
        const projectId=Number(event.target.getAttribute("data-project-id"));

        const reviewId=Number(
            event.target.getAttribute("data-review-id")
        );

        updateReviewStatus(
            projectId,
            reviewId,
            "approved"
        );
    }
    if(event.target.classList.contains("reject-review")){
        const projectId=Number(event.target.getAttribute("data-project-id"));
        const reviewId=Number(event.target.getAttribute("data-review-id"));

        updateReviewStatus(
            projectId,
            reviewId,
            "rejected"
        );
    }

    if(event.target.classList.contains("delete-review")){
        const projectId=Number(event.target.getAttribute("data-project-id"));

        const reviewId=Number(event.target.getAttribute("data-review-id"));

        deleteReview(projectId,reviewId);

    }
});

// ========================================================
// LOAD REVIEWS WHEN ADMIN PAGE OPENS
// ========================================================

loadAdminReviews();

// review button 

document.addEventListener("DOMContentLoaded",function(){

    // Admin login protection

    if(localStorage.getItem("adminLoggedIn") !== "true"){
        window.location.href="admin_login.html";
        return;
    }

    const leadsContainer=document.getElementById("leadsContainer");
    const reviewsContainer = document.getElementById("reviewsContainer");

    // Load leads only on pages that contain the leads container
    if(leadsContainer && typeof displaySavedLeads === "function"){
        displaySavedLeads();
    }

    if(reviewsContainer && typeof loadAdminReviews === "function"){
        loadAdminReviews();
    }
})

// INITIAL LOAD

displaySavedLeads();