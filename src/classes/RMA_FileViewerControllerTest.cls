@isTest
public class RMA_FileViewerControllerTest {
	@isTest
    public static void testRMA_FileViewerController(){
        List<Account> acc = new List<Account>();
        acc.add(new Account(Name = 'test'));
        insert acc;
        String recordId =acc[0].Id;
		Set<Id> libraryIds = new Set<Id>();
        ContentVersion contentVersionObj = new ContentVersion(
            Title='Header_Picture1', 
            PathOnClient ='/Header_Picture1.jpg',
            VersionData = Blob.valueOf('Test Content'),
            origin = 'H'
        );
        insert contentVersionObj;
        ContentVersion contentVersion = [SELECT Id, Title, ContentDocumentId FROM ContentVersion WHERE Id = :contentVersionObj.Id LIMIT 1];
        List<ContentDocument> lstDocument = [SELECT Id, Title, LatestPublishedVersionId FROM ContentDocument];
        
        ContentDocumentLink contentlink = new ContentDocumentLink();
        contentlink.LinkedEntityId = recordId;
        contentlink.contentdocumentid = contentVersion.contentdocumentid;
        contentlink.ShareType = 'V';
        insert contentlink; 
        List<RMA_FileViewerController.DocumentPack> documents  = new List<RMA_FileViewerController.DocumentPack>();
        List<ContentWorkSpace> contentWorkSpaceObj = [SELECT Id, Name, LastModifiedDate, RootContentFolderId 
                                                      FROM ContentWorkspace];
        for(ContentWorkSpace contentWorkSpace : contentWorkSpaceObj){
            libraryIds.add(contentWorkSpace.Id);
        }
        List<ContentDocumentLink> lstcontentDocumentLink = [SELECT ContentDocumentId FROM ContentDocumentLink Where LinkedEntityId in  :libraryIds OR LinkedEntityId  = :recordId];
        List<ContentFolderItem> contentfolderItem = [SELECT Id, Title, FileType, ContentSize, ParentContentFolderId,CreatedbyId,Createdby.Name,LastModifiedDate  
                                               FROM ContentFolderItem 
                                               where ParentContentFolderId = :contentWorkSpaceObj[0].RootContentFolderId];
        RMA_FileViewerController.getDocument(contentfolderItem[0].Title, contentWorkSpaceObj[0].Name, null);
        RMA_FileViewerController.getDocument(null, contentWorkSpaceObj[0].Name, recordId);
        RMA_FileViewerController.getContentFiles(contentfolderItem[0].Id, contentfolderItem[0].Id, contentfolderItem[0].Title);
        RMA_FileViewerController.getLibrary(contentWorkSpaceObj[0].Name, contentfolderItem[0].Title, 'DOC');
        RMA_FileViewerController.getFolderId(contentfolderItem[0].Id,contentfolderItem[0].Title);
        List<SObject> folderItem = RMA_FileViewerController.getFolderItem(contentWorkSpaceObj[0].Name, 'DOC');
    }
}