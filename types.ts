import { RestEndpointMethodTypes } from "@octokit/rest";
import { RowDataPacket } from "mysql2";


export type ListRepoEventsResponse = RestEndpointMethodTypes["activity"]["listRepoEvents"]["response"];
export type GithubRepoEvent = ListRepoEventsResponse["data"][0];