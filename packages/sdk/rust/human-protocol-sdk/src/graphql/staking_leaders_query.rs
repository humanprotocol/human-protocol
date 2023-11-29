use cynic::{impl_scalar};
use serde::{Serialize};


use crate::enums::{Role};

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
  role: Option<Vec<String>>
}


impl Default for LeaderFilter {
  fn default() -> Self {
    Self {
      role: Some(Role::to_string_vec()),
    }
  }
}

impl LeaderFilter {
  pub fn role(mut self, role: Option<Vec<String>>) -> Self {
    self.role = role;
    self
  }

  pub fn build(self) -> LeaderFilter {
    LeaderFilter {
      role: self.role,
    }
  }
}

#[derive(cynic::QueryFragment, Debug)]
#[cynic(graphql_type = "Root", variables = "LeaderFilter")]
#[cynic(schema_path = "schemas/leader.graphql")]
pub struct GetLeadersQuery {
  #[arguments(
    where: { 
      role_in: $role
    }
  )]
  pub leaders: Option<Vec<Leader>>,
}

pub async fn run_query(url: &str, filter: &LeaderFilter) -> cynic::GraphQlResponse<GetLeadersQuery> {
  use cynic::http::ReqwestExt;

  let query = build_query(filter);
  
  reqwest::Client::new()
    .post(url)
    .run_graphql(query)
    .await
    .unwrap()
}

fn build_query(filter: &LeaderFilter) -> cynic::Operation<GetLeadersQuery, LeaderFilter> {
  use cynic::QueryBuilder;

  GetLeadersQuery::build(filter.clone())
}

#[cfg(test)]
mod test {
    use crate::{enums::ChainId, constants::NETWORKS};

    use super::*;
    use tokio::test;

    #[test]
    async fn snapshot_test_query() {
      let filter = LeaderFilter::default();
      let query = build_query(&filter);

      insta::assert_snapshot!(query.query);
    }

    #[tokio::test]
    async fn test_running_query() {
      let network = NETWORKS.get(&ChainId::PolygonMumbai).unwrap();
      let filter = LeaderFilter::default();
      let result = run_query(network.subgraph_url, &filter).await;
      if let Some(errors) = &result.errors {
          assert_eq!(errors.len(), 0);
      }
      insta::assert_debug_snapshot!(result.data);
    }

    #[tokio::test]
    async fn test_filter_builder() {
        let filter = LeaderFilter::default()
            .role(Some(vec!["some_role".to_string()]))
            .build();

        assert_eq!(filter.role, Some(vec!["some_role".to_string()]));
    }
}