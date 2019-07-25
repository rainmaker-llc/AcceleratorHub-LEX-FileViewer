public without sharing class RMA_FileViewerController {
    // Return table data on Load
    @AuraEnabled
    public static List<DocumentPack> getDocument(String folderName, String libraryName, String recordId) {
        Set<Id> contentDocumentId = new Set<Id>();
        List<DocumentPack> documents  = new List<DocumentPack>();
        String folderId;
        Set<Id> libraryIds = new Set<Id>();
        // Return table data when recordId is given
        if(recordId != null){
            String whereClause = 'Where ';
            if(libraryName != null && libraryName != ''){
                for(ContentWorkSpace contentWorkSpace : [Select Id from ContentWorkSpace where Name  = :libraryName]){
                    libraryIds.add(contentWorkSpace.Id);
                }
                whereClause += 'LinkedEntityId in  :libraryIds';    
            }
            if(recordId != null){
                if (libraryName != '' && libraryName != null){
                    whereClause += ' OR ';    
                }
                whereClause += 'LinkedEntityId  = :recordId ';         
            }
            //System.assert(false,'SELECT ContentDocumentId FROM ContentDocumentLink '+whereClause);
            for(ContentDocumentLink cdLink : Database.Query('SELECT ContentDocumentId FROM ContentDocumentLink '+whereClause)){
                contentDocumentId.add(cdLink.ContentDocumentId);
            }
        }
        // Return table data when recordId is not given
        if((recordId == '' || recordId == null)){
            Set<ContentFolderItem> folderItems = new Set<ContentFolderItem>();
            List<ContentWorkSpace> lstContentWorkspaces = [Select Id,RootContentFolderId, Name 
                                                           from ContentWorkSpace 
                                                           where Name  = :libraryName];
            for(ContentFolderItem cfolderItem : [SELECT Id, Title, FileType, ContentSize, ParentContentFolderId,CreatedbyId,Createdby.Name,LastModifiedDate  
                                                 FROM ContentFolderItem 
                                                 where ParentContentFolderId = :lstContentWorkspaces[0].RootContentFolderId
                                                ]){
                                                    if(cfolderItem.FileType != NULL && folderName == ''){
                                                        contentDocumentId.add(cfolderItem.Id);
                                                    }
                                                    else if(cfolderItem.FileType == NULL){
                                                        folderItems.add(cfolderItem);
                                                    }
                                                    if(folderName != '' && cfolderItem.FileType  == null && cfolderItem.Title == folderName){
                                                        folderId = cfolderItem.Id;
                                                    }
                                                }   
            for(ContentFolderItem folder : folderItems){
                DocumentPack docWrapperRecord = new DocumentPack();
                docWrapperRecord.docRecord = folder;            
                List<DocumentPack> foldersContentDocuments = RMA_FileViewerController.getContentFiles(folder.Id,folderId,folderName);
                docWrapperRecord.children = foldersContentDocuments;
                documents.add(docWrapperRecord);
            }
        }
        if(contentDocumentId.size() > 0){
            for(ContentDocument conDoc : [SELECT Id, IsArchived, OwnerId, Owner.Name, LastModifiedDate, Title, ParentId, Description, 
                                          FileType, FileExtension 
                                          FROM ContentDocument where Id in :contentDocumentId]){
                                              DocumentPack docWrapperRecord = new DocumentPack();
                                              docWrapperRecord.docRecord = conDoc;
                                              //docWrapperRecord.TestDocument = [SELECT FileType, VersionData, Id FROM ContentVersion where ContentDocumentId = '06921000000lDSCAA2' limit 1];
                                              documents.add(docWrapperRecord);    
                                          }    
        }
        return documents;
    }
    
    // check is file already exits in list
    Public static List<DocumentPack> getContentFiles(String folderId, String folderIdToCheck,String folderName){
        Set<ContentFolderItem> folderItems = new Set<ContentFolderItem>();
        set<Id> contentDocumentId = new Set<Id>();
        List<DocumentPack> documents  = new List<DocumentPack>();
        for(ContentFolderItem cfolderItem : [SELECT Id, Title, FileType, ContentSize, ParentContentFolderId ,CreatedbyId,Createdby.Name,LastModifiedDate
                                             FROM ContentFolderItem 
                                             where ParentContentFolderId = :folderId order by FileType DESC]){
                                                 if(folderName != '' && cfolderItem.FileType  == null && cfolderItem.Title == folderName){
                                                     folderIdToCheck = cfolderItem.Id;
                                                 }
                                                 system.debug(cfolderItem.ParentContentFolderId+'#####'+folderIdToCheck);
                                                 if(cfolderItem.FileType != NULL){
                                                     contentDocumentId.add(cfolderItem.Id);
                                                 }
                                                 else if(cfolderItem.FileType == NULL){
                                                     folderItems.add(cfolderItem);
                                                 }
                                                 
                                             }  
        for(ContentFolderItem folder : folderItems){
            DocumentPack docWrapperRecord = new DocumentPack();
            docWrapperRecord.docRecord = folder;            
            List<DocumentPack> foldersContentDocuments = RMA_FileViewerController.getContentFiles(folder.Id, folderIdToCheck, folderName);
            docWrapperRecord.children = foldersContentDocuments;
            documents.add(docWrapperRecord);
        }
        if(contentDocumentId.size() > 0){
            for(ContentDocument conDoc : [SELECT Id, IsArchived, OwnerId, Owner.Name, LastModifiedDate, Title, ParentId, Description, 
                                          FileType, FileExtension 
                                          FROM ContentDocument where Id in :contentDocumentId]){
                                              DocumentPack docWrapperRecord = new DocumentPack();
                                              docWrapperRecord.docRecord = conDoc;
                                              documents.add(docWrapperRecord);    
                                          }    
        }
        return documents;    
    }
    
    // Wrapper Class for table data
    public Class DocumentPack{
        @AuraEnabled
        public SObject docRecord;
        @AuraEnabled
        public SObject contentFolderItem;
        @AuraEnabled
        public List<DocumentPack> children;
        @AuraEnabled
        public SObject TestDocument;
        
        public DocumentPack(){
            children = new List<DocumentPack>();    
        }
    }
    
    // Return Libray to gird data
    @AuraEnabled
    public static List<SObject> getLibrary(String libraryName, String folderName, String fileType) {
        Set<String> fileTypeList = new Set<String>();
        for(String fType : fileType.split(',')){
            fileTypeList.add(fType);
        }
        
        String selectedLibraryId;
        if(libraryName != null && libraryName != ''){
            List<ContentWorkSpace> lstContentWorkspaces = [Select Id,RootContentFolderId, Name 
                                                           from ContentWorkSpace 
                                                           where Name  = :libraryName];
            if(lstContentWorkspaces.size() > 0){
                selectedLibraryId = lstContentWorkspaces[0].RootContentFolderId;       
            }
            if(folderName == '' || folderName == null){
                return lstContentWorkspaces;
            }
        }    
        if(folderName != '' && folderName != null){
            
            List<ContentFolderItem> lstContentFolderItems = [SELECT Id,FileType,Title 
                                                             FROM ContentFolderItem  
                                                             where ParentContentFolderId  = :selectedLibraryId and (FileType = null OR FileType in :fileTypeList)];
            String folderId;
            for(ContentFolderItem cfItem:  lstContentFolderItems){
                if(cfItem.Title == folderName){
                    folderId =  cfItem.Id;   
                }    
            }
            if(folderId == null){
                for(ContentFolderItem cfItem:  lstContentFolderItems){
                    folderId = RMA_FileViewerController.getFolderId(cfItem.Id,folderName);        
                }
            }
            if(folderId != null){
                return [SELECT Id,FileType,Title 
                        FROM ContentFolderItem 
                        where ParentContentFolderId  = :folderId and (FileType = null OR FileType in :fileTypeList)];    
            }
            
        }
        return null;
    }
    
    // Return Folder to gird data
    public Static String getFolderId(String folderId,String folderName){
        List<ContentFolderItem> lstContentFolderItems = [SELECT Id,FileType,Title 
                                                         FROM ContentFolderItem 
                                                         where ParentContentFolderId  = :folderId and FileType = null];
        for(ContentFolderItem cfItem:  lstContentFolderItems){
            if(cfItem.Title == folderName){
                folderId =  cfItem.Id;   
            }    
        }
        if(folderId == null){
            for(ContentFolderItem cfItem:  lstContentFolderItems){
                if(folderId == null){
                    folderId = RMA_FileViewerController.getFolderId(cfItem.Id,folderName);    
                }
            }
        }  
        return folderId;
    }
    
    //return Files and Folder to grid data    
    @AuraEnabled
    public static List<SObject> getFolderItem(String libraryName, String fileType) {
        Set<String> fileTypeList = new Set<String>();
        for(String fType : fileType.split(',')){
            fileTypeList.add(fType);
        }
        
        return [SELECT Id,FileType,Title 
                FROM ContentFolderItem 
                where ParentContentFolderId  = :libraryName and (FileType = null OR FileType in :fileTypeList)];
    }
    
    @AuraEnabled 
    public static String getVideoURL(String documentId) {
        if(documentId != null){
            Video_URL__c vURL = Video_URL__c.getInstance();
            ContentVersion cv = [SELECT FileType, ContentSize,ContentDocumentId, VersionData, Id FROM ContentVersion where ContentDocumentId =:documentId  limit 1];
            return vURL.VF_Page_Domain__c+''+cv.id; 
        }
        return null;
    }
}