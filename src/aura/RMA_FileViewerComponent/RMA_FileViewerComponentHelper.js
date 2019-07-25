({
    // get Children data
    getChildren : function(data, helper){
        var gridData = []; 
        console.log('Helper Data ####',data);
        if(data.length > 0){
            data.forEach(function(rec){
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
                item['Download'] = 'Download';
                console.log(rec.children.length);
                if(rec.children.length > 0){
                    console.log('Helper');
                    item['_children'] = helper.getChildren(rec.children,helper);
                }
                gridData.push(item);
            });
        }
        return gridData;
    },
    
    // Sort table data
    sortData: function (cmp, fieldName, sortDirection) {
        var reverse;
        var data = cmp.get("v.gridData");
        if(sortDirection == 'ASC' || sortDirection == 'DESC'){
            reverse = sortDirection.toLowerCase() !== 'asc';
        }else{
            reverse = sortDirection !== 'asc';
        }
        data = Object.assign([],data.sort(this.sortBy(fieldName, reverse ? -1 : 1)));
        cmp.set("v.gridData", data);
    },
    // Sort table data By attribute value
    sortBy: function (field, reverse, primer) {
        var key = primer
        ? function(x) { return primer(x[field]) }
        : function(x) { return x[field] };
        
        return function (a, b) {
            var A = key(a);
            var B = key(b);
            return reverse * ((A > B) - (B > A));
        };
    },
    // Privew File
    showFile : function(component, event, helper) {
        let docId = event.target.id;
        $A.get('e.lightning:openFiles').fire({
            recordIds: [docId]
        });
        
    },
    
    //add children to attribute
    addChildrenToRow: function(data, rowName, children) {
        var that = this;
        // step through the array using recursion until we find the correct row to update
        var newData = data.map(function(row) {
            // does this row have a properly formatted _children key with content?
            var hasChildrenContent = false;
            if (row.hasOwnProperty('_children') && Array.isArray(row._children) && row._children.length > 0) {
                hasChildrenContent = true;
            }
            if (row.name === rowName) {
                row._children = children;
            } else if (hasChildrenContent) {
                that.addChildrenToRow(row._children, rowName, children);
            }
            return row;
        });
        return newData;
    },
    
    retrieveUpdatedData: function(rowName) {
        var that = this;
        return new Promise(function (resolve, reject) {
            // mimic server delay
            window.setTimeout(function() {
                // add children to data
                var updatedData = that.addChildrenToRow(that.originalData, rowName, that.childrenData[rowName]);
                resolve(updatedData);
            },2000);
        });
    },
    
    // show children data
    breadCrumbValue: function(cmp,event,helper){
        var action=cmp.get("c.getLibrary");
        // set param to method
        action.setParams({
            'libraryName' : cmp.get("v.Library"),
            'folderName' : cmp.get("v.Folder"),
            'fileType' : cmp.get("v.fileType")
        });
        // set a callBack
        action.setCallback(this, function(response){
            var state = response.getState();
            if(state == "SUCCESS"){
                var storeresponce = response.getReturnValue();
                cmp.set("v.gridItems",response.getReturnValue());
            }
            if(cmp.get("v.Folder") != '' && cmp.get("v.Folder") != null){
                cmp.set("v.isRootFolder",false);
            }
            console.log("gridItems",cmp.get("v.gridItems"));
        });
        // enqueue the Action
        $A.enqueueAction(action);
    },
    
    // Update breadcrumb value and show data according to it
    showItems: function (cmp, event, helper){
        var breadCrumbVal = cmp.get("v.breadcrumbCollection");
        var folerId = event.currentTarget.id;
        var FolderName = event.currentTarget.title;
        var FolderTitle = cmp.get("v.entityVal");
        if(FolderName){
            var count = false;
            for(var i=0;i< breadCrumbVal.length;i++){
                if(breadCrumbVal[i].name == folerId){
                    count = true;
                }
            }
            if(count == false){
                breadCrumbVal.push({
                    'label': FolderName,
                    'name': folerId
                });
            }
        }else{
            for(var i=0 ;i<FolderTitle.length;i++){
                if(FolderTitle[i].Id == folerId){
                    var count = false
                    for(var j=0;j<breadCrumbVal.length;j++){
                        if(breadCrumbVal[i].name == folerId){
                            count = true;
                        }
                    }
                    if(count == false){
                        breadCrumbVal.push({
                            'label': FolderTitle[i].Title,
                            'name': FolderTitle[i].Id
                        });
                    }
                }
            }
        }
        cmp.set("v.breadcrumbCollection",breadCrumbVal);
        console.log("libraryName",folerId);
        var action=cmp.get("c.getFolderItem");
        // set param to method
        action.setParams({
            'libraryName' : folerId,
            'fileType' : cmp.get("v.fileType")
        });
        // set a callBack
        action.setCallback(this, function(response){
            var state = response.getState();
            if(state == "SUCCESS"){
                cmp.set("v.gridItems",response.getReturnValue());
                cmp.set("v.entityVal",response.getReturnValue());
                cmp.set("v.isRootFolder",false);
                var storeresponce = response.getReturnValue();
                console.log("storeresponce",storeresponce);
                if(storeresponce.length > 0){
                    var gridData = [];
                    storeresponce.forEach(function(rec){
                        gridData.push(rec);
                    });
                }
            }
        });
        // enqueue the Action
        $A.enqueueAction(action);
    },
    
})