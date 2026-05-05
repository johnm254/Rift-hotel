rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Profile collection - anyone can read, only authenticated users can write
    match /profile/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Projects collection
    match /projects/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Skills collection
    match /skills/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Experience collection
    match /experience/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Contacts collection
    match /contacts/{document=**} {
      allow read: if request.auth != null;
      allow write: if true;  // Anyone can submit contact form
    }
  }
}
