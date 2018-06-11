CREATE TABLE TutorLogExtra(
    ID INT PRIMARY KEY NOT NULL IDENTITY(1,1),
    UserID INT NOT NULL FOREIGN KEY REFERENCES Users(ID),
    TutorLogIntervalID INT NOT NULL FOREIGN KEY REFERENCES TutorLogInterval(ID),
    Note NVARCHAR(MAX),
    ExtraValue INT NOT NULL,
)