({
    // This function call when page load
    init: function (cmp, event, helper) {
        var displayAs = cmp.get("v.displayAs");
        if(displayAs == 'Grid'){
            var libraryName = cmp.get("v.Library");
            var breadCrumbVal = [];
            breadCrumbVal.push({
                'label': 'Libraries',
                'name': 'Libraries'
            });
            cmp.set("v.breadcrumbCollection",breadCrumbVal);
            // Call helper function
            helper.breadCrumbValue(cmp,event,helper);
        }else{
            // set Attribute Value  
            cmp.set('v.gridColumns', [{label: 'Title', fieldName: 'TitleLink', sortable: true, type: "url",
                                       typeAttributes: { label: {fieldName: 'Title'}},
                                       sortable:true
                                      },
                                      {label: 'Owner', fieldName: 'OwnerLink', sortable: true, type: 'url', 
                                       typeAttributes: { label: {fieldName: 'OwnerName'}},
                                       sortable:false
                                      },
                                      {label: 'Last Modified Date', fieldName: 'LastModifiedDate', type: 'date', 
                                       sortable: true, typeAttributes: {day: 'numeric', month: 'short', 
                                                                        year: 'numeric', hour: '2-digit',
                                                                        minute: '2-digit', 
                                                                        hour12: true }},
                                      {label: 'Action', type: "button" ,typeAttributes: {label: 'View',
                                                                                         name: 'preview',
                                                                                         title: 'View',
                                                                                         value: 'view',
                                                                                         iconPosition: 'left',
                                                                                         disabled: {fieldName: 'actionDisabled'}}},
                                      {label: 'Download', fieldName: 'DownloadLink', type: "url", typeAttributes: 
                                       { label: {fieldName: 'Download'}}}]);
            var limit = cmp.get("v.limit");
            var action=cmp.get("c.getDocument");
            // set param to method
            action.setParams({
                'folderName' : cmp.get("v.Folder"),
                'libraryName' : cmp.get("v.Library"),
                'recordId' : cmp.get("v.recordId"),
                'fileType' : cmp.get("v.fileType")
            });
            // set a callBack
            action.setCallback(this, function(response){
                var state = response.getState();
                if(state == "SUCCESS"){
                    var storeresponce = response.getReturnValue();
                    var gridData = []; 
                    console.log('Response Data ####',storeresponce);
                    // if storeResponse size is greaterthen 0
                    if(storeresponce.length > 0){
                        storeresponce.forEach(function(rec){
                            var item = rec.docRecord;
                            item['TitleLink'] = '/'+item.Id; 
                            if(item.OwnerId != undefined){
                                item['OwnerLink'] = '/'+item.OwnerId;  
                                item['OwnerName'] = item.Owner.Name;
                                item['actionDisabled'] = false;
                                item['DownloadLink'] = '/sfc/servlet.shepherd/document/download/'+item.Id+'?operationContext=S1';
                            }
                            else{
                                item['OwnerLink'] = '/'+item.CreatedById;  
                                item['OwnerName'] = item.CreatedBy.Name;
                                item['actionDisabled'] = true;
                            }
                            var libraryName = cmp.get("v.Library");
                            item['Download'] = 'Download';
                            if(rec.children.length > 0){
                                // Call helper function
                                item['_children'] = helper.getChildren(rec.children, helper);
                            }
                            gridData.push(item);
                        });
                        cmp.set("v.gridData", gridData);
                        var orderBy = cmp.get('v.orderBy');
                        var sortOrder = cmp.get('v.sortOrder');
                        if(orderBy && sortOrder){
                            var fieldName = orderBy;
                            var sortDirection = sortOrder;
                            cmp.set("v.orderBy", '');
                            cmp.set("v.sortOrder", '');
                            // Call helper function
                            helper.sortData(cmp, fieldName, sortDirection);
                        }
                    }
                }
            })
            // enqueue the Action
            $A.enqueueAction(action);
        }
    },
    
    // This function sort table data
    updateColumnSorting: function (cmp, event, helper) {
        cmp.set('v.isLoading', true);
        // We use the setTimeout method here to simulate the async
        // process of the sorting data, so that user will see the
        // spinner loading when the data is being sorted.
        setTimeout(function() {
            var fieldName = event.getParam('fieldName');
            var sortDirection = event.getParam('sortDirection');
            cmp.set("v.sortedBy", fieldName);
            cmp.set("v.sortedDirection", sortDirection);
            // Call helper function
            helper.sortData(cmp, fieldName, sortDirection);
            cmp.set('v.isLoading', false);
        }, 0);
    },
    
    // handle table Row Actions
    handleRowAction: function (cmp, event, helper) {
        var action = event.getParam('action');
        var row = event.getParam('row');
        switch (action.name) {
            case 'preview':
                $A.get('e.lightning:openFiles').fire({
                    recordIds: [row.Id]
                });
                break;
            case 'download':
                $A.get('e.lightning:openFiles').fire({
                    recordIds: [row.Id]
                });
                break;
            case 'delete':
                helper.removeBook(cmp, row)
                break;
        }
    },
    
    handleRowToggle: function(cmp, event, helper) {
        // retrieve the unique identifier of the row being expanded
        var rowName = event.getParam('Title');
        
        // the new expanded state for this row
        var isExpanded = event.getParam('isExpanded');
        
        // does the component have children content for this row already?
        var hasChildrenContent = event.getParam('hasChildrenContent');
        
        // the complete row data
        var row = event.getParam('row');
        
        // the row names that are currently expanded
        var expandedRows = cmp.find('treegrid_async').getCurrentExpandedRows();
        
        // if hasChildrenContent is false then we need to react and add children
        if (hasChildrenContent === false) {
            cmp.set('v.isLoading', true);
            
            // call a method to retrieve the updated data tree that includes the missing children
            helper.retrieveUpdatedData(rowName).then(function (newData) {
                cmp.set('v.gridData', newData);
                cmp.set('v.isLoading', false);
            });
        }
    },
    
    //Update Navigation Value
    navigateTo: function (cmp, event, helper) {
        var breadCrumbVal = cmp.get("v.breadcrumbCollection");
        var name = event.getSource().get('v.name');
        for(var i=0;i< breadCrumbVal.length;i++){
            if(breadCrumbVal[i].name == name){
                breadCrumbVal.splice(i+1,breadCrumbVal.length+1);
            }
        }
        cmp.set("v.breadcrumbCollection",breadCrumbVal);
        if(name == 'Libraries'){
            // Call helper function
            helper.breadCrumbValue(cmp,event,helper);
            cmp.set("v.isRootFolder",true);
        }else{
            var action=cmp.get("c.getFolderItem");
            // set param to method
            action.setParams({
                'libraryName' : name,
            });
            // set a callBack
            action.setCallback(this, function(response){
                var state = response.getState();
                if(state == "SUCCESS"){
                    cmp.set("v.gridItems",response.getReturnValue());
                    cmp.set("v.entityVal",response.getReturnValue());
                    cmp.set("v.isRootFolder",false);
                }
            });
            // enqueue the Action
            $A.enqueueAction(action);
        }
    },
    showItems: function (cmp, event, helper){
        // Call helper function
        helper.showItems(cmp, event, helper);
    },
    showVideos: function (cmp, event, helper){
        console.log("showVideos");
        var div = document.getElementById('VideoContainor');
        if(div.style.display == 'none'){
            var documentId = event.currentTarget.id;
            cmp.set("v.documentId",documentId);
            var action=cmp.get("c.getVideoURL");
            // set param to method
            action.setParams({
                'documentId' : documentId
            });
            // set a callBack
            action.setCallback(this, function(response){
                var state = response.getState();
                if(state == "SUCCESS"){
                    cmp.set("v.contentDocumentId",response.getReturnValue());
                    console.log('Content Version Id######',response.getReturnValue());
                    div.style.display = 'block';
                }
                else{
                    alert('Having issue in running the video, Please try again.');
                }
            });
            // enqueue the Action
            $A.enqueueAction(action);
        }else{
            div.style.display = 'none';
            var video = document.getElementById("myVideo");
            //video.src = '';
        }
    },
})