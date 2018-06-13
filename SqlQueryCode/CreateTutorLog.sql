CREATE TABLE TutorLog(
    ID INT PRIMARY KEY NOT NULL IDENTITY(1,1),
    UserID INT NOT NULL FOREIGN KEY REFERENCES Users(ID),
    TutorLogDate DATE NOT NULL,
    CheckIn TIME NOT NULL,
    CheckOut TIME,
    LastEdited DATETIME2 NOT NULL,
    EditedBy INT FOREIGN KEY REFERENCES Users(ID),
    Detail0 VARCHAR(20),
    Detail1 VARCHAR(20),
    Detail2 VARCHAR(20),
    Detail3 VARCHAR(20),
    Detail4 VARCHAR(20),
    TutorLogStatue VARCHAR(20),
)