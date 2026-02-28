import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface DatasetSession {
    id: string;
    owner: Principal;
    name: string;
    createdAt: Time;
    updatedAt: Time;
    analysisResults: string;
    rawData: string;
}
export type Time = bigint;
export interface DashboardStats {
    dataAnalysisCount: bigint;
    cashFlowCount: bigint;
    plCount: bigint;
    balanceSheetCount: bigint;
    gstCount: bigint;
}
export interface ReportSession {
    id: string;
    owner: Principal;
    name: string;
    createdAt: Time;
    formData: string;
    results: string;
    reportType: ReportType;
    updatedAt: Time;
}
export enum ReportType {
    pl = "pl",
    gst = "gst",
    balance_sheet = "balance_sheet",
    cash_flow = "cash_flow",
    data_analysis = "data_analysis"
}
export interface backendInterface {
    createDatasetSession(id: string, name: string, rawData: string, analysisResults: string): Promise<string>;
    createReportSession(id: string, name: string, reportType: ReportType, formData: string, results: string): Promise<string>;
    deleteDatasetSession(id: string): Promise<void>;
    deleteReportSession(id: string): Promise<void>;
    getAllDatasetSessions(): Promise<Array<DatasetSession>>;
    getAllReportSessions(): Promise<Array<ReportSession>>;
    getDashboardStats(): Promise<DashboardStats>;
    getDatasetSession(id: string): Promise<DatasetSession | null>;
    getReportSession(id: string): Promise<ReportSession | null>;
    updateDatasetSession(id: string, name: string, rawData: string, analysisResults: string): Promise<void>;
    updateReportSession(id: string, name: string, reportType: ReportType, formData: string, results: string): Promise<void>;
}
