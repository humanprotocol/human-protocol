use chrono::{DateTime, Utc};
use cynic::{impl_scalar};
use serde::{Serialize};


use crate::enums::EscrowStatus;

mod schema {
  cynic::use_schema!("schemas/escrow.graphql");
}

impl_scalar!(i64, schema::I64);

#[derive(Serialize, Debug, Clone, cynic::QueryFragment)]
#[cynic(schema_path = "schemas/escrow.graphql")]
pub struct EscrowData {
  pub id: String,
  pub address: String,
  pub amount_paid: cynic::Id,
  pub balance: cynic::Id,
  pub count: cynic::Id,
  pub factory_address: String,
  pub launcher: String,
  pub status: Option<String>,
  pub token: String,
  pub total_funded_amount: cynic::Id,
  pub created_at: String,
  pub final_results_url: Option<String>,
  pub intermediate_results_url: Option<String>,
  pub manifest_hash: Option<String>,
  pub manifest_url: Option<String>,
  pub recording_oracle: Option<String>,
  pub recording_oracle_fee: Option<cynic::Id>,
  pub reputation_oracle: Option<String>,
  pub reputation_oracle_fee: Option<cynic::Id>,
  pub exchange_oracle: Option<String>,
  pub exchange_oracle_fee: Option<cynic::Id>,
}

#[derive(cynic::QueryVariables, Clone)]
pub struct EscrowFilter {
  launcher: Option<String>,
  exchange_oracle: Option<String>,
  recording_oracle: Option<String>,
  reputation_oracle: Option<String>,
  job_requester_id: Option<String>,
  status: Option<Vec<String>>,
  from: Option<String>,
  to: Option<String>,
}


impl Default for EscrowFilter {
  fn default() -> Self { 
    let current_datetime: DateTime<Utc> = Utc::now();
    let timestamp: i64 = current_datetime.timestamp();

    Self {
      launcher: Some("0x".into()),
      exchange_oracle: None,
      recording_oracle: Some("0x".into()),
      reputation_oracle: Some("0x".into()),
      job_requester_id: None,
      status: Some(EscrowStatus::to_string_vec()),
      from: Some("0".to_string()),
      to: Some(timestamp.to_string()),
    }
  }
}

impl EscrowFilter {
  pub fn launcher(mut self, launcher: Option<String>) -> Self {
    self.launcher = launcher;
    self
  }

  pub fn exchange_oracle(mut self, exchange_oracle: Option<String>) -> Self {
    self.exchange_oracle = exchange_oracle;
    self
  }

  pub fn recording_oracle(mut self, recording_oracle: Option<String>) -> Self {
    self.recording_oracle = recording_oracle;
    self
  }

  pub fn reputation_oracle(mut self, reputation_oracle: Option<String>) -> Self {
    self.reputation_oracle = reputation_oracle;
    self
  }

  pub fn job_requester_id(mut self, job_requester_id: Option<String>) -> Self {
    self.job_requester_id = job_requester_id;
    self
  }

  pub fn status(mut self, status: Option<Vec<String>>) -> Self {
    self.status = status;
    self
  } 

  pub fn from(mut self, from: Option<String>) -> Self {
    self.from = from;
    self
  }

  pub fn to(mut self, to: Option<String>) -> Self {
    self.to = to;
    self
  }

  pub fn build(self) -> EscrowFilter {
      EscrowFilter {
          launcher: self.launcher,
          exchange_oracle: self.exchange_oracle,
          recording_oracle: self.recording_oracle,
          reputation_oracle: self.reputation_oracle,
          job_requester_id: self.job_requester_id,
          status: self.status,
          from: self.from,
          to: self.to,
      }
  }
}

#[derive(cynic::QueryFragment, Debug)]
#[cynic(graphql_type = "Root", variables = "EscrowFilter")]
#[cynic(schema_path = "schemas/escrow.graphql")]
pub struct GetEscrowsQuery {
  #[arguments(
    where: { 
      launcher_contains: $launcher,  
      exchangeOracle: $exchange_oracle,
      recordingOracle_contains: $recording_oracle,
      reputationOracle_contains: $reputation_oracle,
      jobRequesterId: $job_requester_id,
      status_in: $status,
      createdAt_gte: $from,
      createdAt_lte: $to
    }
  )]
  pub escrows: Option<Vec<EscrowData>>,
}

pub async fn run_query(url: &str, filter: &EscrowFilter) -> cynic::GraphQlResponse<GetEscrowsQuery> {
  use cynic::http::ReqwestExt;

  let query = build_query(filter);
  
  reqwest::Client::new()
    .post(url)
    .run_graphql(query)
    .await
    .unwrap()
}

fn build_query(filter: &EscrowFilter) -> cynic::Operation<GetEscrowsQuery, EscrowFilter> {
  use cynic::QueryBuilder;

  GetEscrowsQuery::build(filter.clone())
}

#[cfg(test)]
mod test {
    use crate::{enums::ChainId, constants::NETWORKS};

    use super::*;
    use tokio::test;

    #[test]
    async fn snapshot_test_query() {
      let filter = EscrowFilter::default();
      let query = build_query(&filter);

      insta::assert_snapshot!(query.query);
    }

    #[tokio::test]
    async fn test_running_query() {
      let network = NETWORKS.get(&ChainId::PolygonMumbai).unwrap();
      let filter = EscrowFilter::default();
      let result = run_query(network.subgraph_url, &filter).await;
      if let Some(errors) = &result.errors {
          assert_eq!(errors.len(), 0);
      }
      insta::assert_debug_snapshot!(result.data);
    }

    #[tokio::test]
    async fn test_filter_builder() {
        let filter = EscrowFilter::default()
            .launcher(Some("some_launcher".to_string()))
            .exchange_oracle(Some("some_exchange_oracle".to_string()))
            .recording_oracle(Some("some_recording_oracle".to_string()))
            .reputation_oracle(Some("some_reputation_oracle".to_string()))
            .job_requester_id(Some("some_job_requester_id".to_string()))
            .status(Some(vec!["status1".to_string(), "status2".to_string()]))
            .from(Some("start_date".to_string()))
            .to(Some("end_date".to_string()))
            .build();

        assert_eq!(filter.launcher, Some("some_launcher".to_string()));
        assert_eq!(
            filter.exchange_oracle,
            Some("some_exchange_oracle".to_string())
        );
        assert_eq!(
            filter.recording_oracle,
            Some("some_recording_oracle".to_string())
        );
        assert_eq!(
            filter.reputation_oracle,
            Some("some_reputation_oracle".to_string())
        );
        assert_eq!(
            filter.job_requester_id,
            Some("some_job_requester_id".to_string())
        );
        assert_eq!(
            filter.status,
            Some(vec!["status1".to_string(), "status2".to_string()])
        );
        assert_eq!(filter.from, Some("start_date".to_string()));
        assert_eq!(filter.to, Some("end_date".to_string()));
    }
}