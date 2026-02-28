import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";

actor {
  type ReportType = {
    #pl;
    #balance_sheet;
    #cash_flow;
    #gst;
    #data_analysis;
  };

  type ReportSession = {
    id : Text;
    name : Text;
    reportType : ReportType;
    formData : Text;
    results : Text;
    createdAt : Time.Time;
    updatedAt : Time.Time;
    owner : Principal;
  };

  type DatasetSession = {
    id : Text;
    name : Text;
    rawData : Text;
    analysisResults : Text;
    createdAt : Time.Time;
    updatedAt : Time.Time;
    owner : Principal;
  };

  type DashboardStats = {
    plCount : Nat;
    balanceSheetCount : Nat;
    cashFlowCount : Nat;
    gstCount : Nat;
    dataAnalysisCount : Nat;
  };

  module ReportSession {
    public func compare(s1 : ReportSession, s2 : ReportSession) : Order.Order {
      Text.compare(s1.id, s2.id);
    };
  };

  module DatasetSession {
    public func compare(s1 : DatasetSession, s2 : DatasetSession) : Order.Order {
      Text.compare(s1.id, s2.id);
    };
  };

  let reportSessions = Map.empty<Text, ReportSession>();
  let datasetSessions = Map.empty<Text, DatasetSession>();

  public shared ({ caller }) func createReportSession(id : Text, name : Text, reportType : ReportType, formData : Text, results : Text) : async Text {
    if (reportSessions.containsKey(id)) {
      Runtime.trap("Report session with this ID already exists");
    };
    let now = Time.now();
    let session : ReportSession = {
      id;
      name;
      reportType;
      formData;
      results;
      createdAt = now;
      updatedAt = now;
      owner = caller;
    };
    reportSessions.add(id, session);
    id;
  };

  public shared ({ caller }) func updateReportSession(id : Text, name : Text, reportType : ReportType, formData : Text, results : Text) : async () {
    switch (reportSessions.get(id)) {
      case (null) { Runtime.trap("Report session not found") };
      case (?existing) {
        if (existing.owner != caller) {
          Runtime.trap("Unauthorized");
        };
        let updated : ReportSession = {
          id;
          name;
          reportType;
          formData;
          results;
          createdAt = existing.createdAt;
          updatedAt = Time.now();
          owner = caller;
        };
        reportSessions.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteReportSession(id : Text) : async () {
    switch (reportSessions.get(id)) {
      case (null) { Runtime.trap("Report session not found") };
      case (?existing) {
        if (existing.owner != caller) {
          Runtime.trap("Unauthorized");
        };
        reportSessions.remove(id);
      };
    };
  };

  public query ({ caller }) func getReportSession(id : Text) : async ?ReportSession {
    switch (reportSessions.get(id)) {
      case (null) { null };
      case (?session) {
        if (session.owner == caller) { ?session } else { null };
      };
    };
  };

  public query ({ caller }) func getAllReportSessions() : async [ReportSession] {
    reportSessions.values().toArray().filter(
      func(s) { s.owner == caller }
    );
  };

  public shared ({ caller }) func createDatasetSession(id : Text, name : Text, rawData : Text, analysisResults : Text) : async Text {
    if (datasetSessions.containsKey(id)) {
      Runtime.trap("Dataset session with this ID already exists");
    };
    let now = Time.now();
    let session : DatasetSession = {
      id;
      name;
      rawData;
      analysisResults;
      createdAt = now;
      updatedAt = now;
      owner = caller;
    };
    datasetSessions.add(id, session);
    id;
  };

  public shared ({ caller }) func updateDatasetSession(id : Text, name : Text, rawData : Text, analysisResults : Text) : async () {
    switch (datasetSessions.get(id)) {
      case (null) { Runtime.trap("Dataset session not found") };
      case (?existing) {
        if (existing.owner != caller) {
          Runtime.trap("Unauthorized");
        };
        let updated : DatasetSession = {
          id;
          name;
          rawData;
          analysisResults;
          createdAt = existing.createdAt;
          updatedAt = Time.now();
          owner = caller;
        };
        datasetSessions.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteDatasetSession(id : Text) : async () {
    switch (datasetSessions.get(id)) {
      case (null) { Runtime.trap("Dataset session not found") };
      case (?existing) {
        if (existing.owner != caller) {
          Runtime.trap("Unauthorized");
        };
        datasetSessions.remove(id);
      };
    };
  };

  public query ({ caller }) func getDatasetSession(id : Text) : async ?DatasetSession {
    switch (datasetSessions.get(id)) {
      case (null) { null };
      case (?session) {
        if (session.owner == caller) { ?session } else { null };
      };
    };
  };

  public query ({ caller }) func getAllDatasetSessions() : async [DatasetSession] {
    datasetSessions.values().toArray().filter(
      func(s) { s.owner == caller }
    );
  };

  public query ({ caller }) func getDashboardStats() : async DashboardStats {
    let sessions = reportSessions.values().toArray().filter(
      func(s) { s.owner == caller }
    );

    var plCount = 0;
    var balanceSheetCount = 0;
    var cashFlowCount = 0;
    var gstCount = 0;
    var dataAnalysisCount = 0;

    sessions.forEach(
      func(s) {
        switch (s.reportType) {
          case (#pl) { plCount += 1 };
          case (#balance_sheet) { balanceSheetCount += 1 };
          case (#cash_flow) { cashFlowCount += 1 };
          case (#gst) { gstCount += 1 };
          case (#data_analysis) { dataAnalysisCount += 1 };
        };
      }
    );

    {
      plCount;
      balanceSheetCount;
      cashFlowCount;
      gstCount;
      dataAnalysisCount;
    };
  };
};
