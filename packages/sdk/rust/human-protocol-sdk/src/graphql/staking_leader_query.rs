use cynic::{impl_scalar};
use serde::{Serialize};


mod schema {
  cynic::use_schema!("schemas/leader.graphql");
}

impl_scalar!(i64, schema::I64);

#[derive(Serialize, Debug, Clone, cynic::QueryFragment)]
#[cynic(schema_path = "schemas/leader.graphql")]
pub struct Leader {
  id: String,
  address: String,
  amount_staked: cynic::Id,
  amount_allocated: cynic::Id,
  amount_locked: cynic::Id,
  locked_until_timestamp: cynic::Id,
  amount_withdrawn: cynic::Id,
  amount_slashed: cynic::Id,
  reputation: cynic::Id,
  reward: cynic::Id,
  amount_jobs_launched: cynic::Id,
  role: Option<String>,
  fee: Option<cynic::Id>,
  public_key: Option<String>,
  webhook_url: Option<String>,
  url: Option<String>,
}

#[derive(cynic::QueryVariables, Clone)]
pub struct LeaderFilter {
  pub id: String,
}

#[derive(cynic::QueryFragment, Debug)]
#[cynic(graphql_type = "Root", variables = "LeaderFilter")]
#[cynic(schema_path = "schemas/leader.graphql")]
pub struct GetLeaderQuery {
  #[arguments(id: $id)]
  pub leader: Option<Leader>,
}

pub async fn run_query(url: &str, filter: &LeaderFilter) -> cynic::GraphQlResponse<GetLeaderQuery> {
  use cynic::http::ReqwestExt;

  let query = build_query(filter);
  
  reqwest::Client::new()
    .post(url)
    .run_graphql(query)
    .await
    .unwrap()
}

fn build_query(filter: &LeaderFilter) -> cynic::Operation<GetLeaderQuery, LeaderFilter> {
  use cynic::QueryBuilder;

  GetLeaderQuery::build(filter.clone())
}

#[cfg(test)]
mod test {
    use crate::{enums::ChainId, constants::NETWORKS};

    use super::*;
    use tokio::test;

    #[test]
    async fn snapshot_test_query() {
      let filter = LeaderFilter {
        id: "some_address".to_string()
      };
      let query = build_query(&filter);

      insta::assert_snapshot!(query.query);
    }

    #[tokio::test]
    async fn test_running_query() {
      let network = NETWORKS.get(&ChainId::PolygonMumbai).unwrap();
      let filter = LeaderFilter {
        id: "0x9d1f5d4c4aa1764bf63583c3392f626e2ffbe5f7".to_string()
      };
      let result = run_query(network.subgraph_url, &filter).await;
      if let Some(errors) = &result.errors {
          assert_eq!(errors.len(), 0);
      }
      insta::assert_debug_snapshot!(result.data);
    }

    #[tokio::test]
    async fn test_filter_builder() {
      let filter = LeaderFilter {
        id: "some_address".into()
      };

      assert_eq!(filter.id, "some_address".to_string());
    }
}