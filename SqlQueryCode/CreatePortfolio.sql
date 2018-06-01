CREATE TABLE Portfolio(
    ID INT PRIMARY KEY NOT NULL IDENTITY(1,1),
    StudentID INT NOT NULL FOREIGN KEY REFERENCES Users(ID),
    HybridSheetID INT NOT NULL FOREIGN KEY REFERENCES HybridSheet(ID),
    StartDate DATE,
    EndDate DATE,
    Score VARCHAR(16)
)