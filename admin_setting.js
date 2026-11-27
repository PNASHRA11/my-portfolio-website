// CHANGE ADMIN ID
const changeAdminIdButton=document.getElementById("changeAdminIdButton");

if(changeAdminIdButton){
    changeAdminIdButton.addEventListener("click",function(){
        const newAdminId=document.getElementById("nwAdminId").value.trim();
        const currentPassword=document.getElementById("currentPasswordForId").value;
        const message=document.getElementById("adminIdMessage");

        if(!newAdminId || !currentPassword){
            message.textContent="Please fill all fields.";
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
            console.log("STATUS :",response.status);
            console.log("URL :",response.url);
            return response.text();
        })

        .then(function(data){
            console.log("SERVER RESPONSE :",data);
        })
        .catch(function(error){
            console.error("Change Admin ID error:",error);

        });

    });
}

// CHANGE PASSWORD
const changePasswordButton=document.getElementById("changePasswordButton");

if(changePasswordButton){
    changePasswordButton.addEventListener("click",function(){
        const currentPassword=document.getElementById("currentPassword").value;
        const newPassword=document.getElementById("newPassword").value;
        const confirmPassword=document.getElementById("confirmPassword").value;

        const message=document.getElementById("passwordMessage");

        console.log("currentPassword :",currentPassword);
        console.log("newPassword :",newPassword);
        console.log("confirmPassword :",confirmPassword);

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
                document.getElementById("newPssword").value="";
                document.getElementById("confirmPassword").value="";

            }
        })

        .catch(function(error){
            console.log("change password error :",error);

            message.textContent="server connection error";
        });


    });
}