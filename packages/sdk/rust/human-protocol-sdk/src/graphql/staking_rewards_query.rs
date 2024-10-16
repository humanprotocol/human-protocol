use serde::Serialize;


mod schema {
  cynic::use_schema!("schemas/reward.graphql");
}


#[derive(Serialize, Debug, Clone, cynic::QueryFragment)]
#[cynic(schema_path = "schemas/reward.graphql")]
pub struct Reward {
  escrow_address: String,
  staker: String,
  slasher: Option<String>,
  amount: cynic::Id
}

#[derive(cynic::QueryVariables, Clone)]
pub struct RewardFilter {
  pub slasher: String
}

#[derive(cynic::QueryFragment, Debug)]
#[cynic(graphql_type = "Root", variables = "RewardFilter")]
#[cynic(schema_path = "schemas/reward.graphql")]
pub struct GetRewardsQuery {
  #[arguments(
    where: { 
      slasher_contains: $slasher
    }
  )]
  pub reward_added_events: Option<Vec<Reward>>,
}

pub async fn run_query(url: &str, filter: &RewardFilter) -> cynic::GraphQlResponse<GetRewardsQuery> {
  use cynic::http::ReqwestExt;

  let query = build_query(filter);
  
  reqwest::Client::new()
    .post(url)
    .run_graphql(query)
    .await
    .unwrap()
}

fn build_query(filter: &RewardFilter) -> cynic::Operation<GetRewardsQuery, RewardFilter> {
  use cynic::QueryBuilder;

  GetRewardsQuery::build(filter.clone())
}

#[cfg(test)]
mod test {
    use crate::{enums::ChainId, constants::NETWORKS};

    use super::*;
    use tokio::test;

    #[test]
    async fn snapshot_test_query() {
      let filter = RewardFilter {
        slasher: "some_address".to_string()
      };
      let query = build_query(&filter);

      insta::assert_snapshot!(query.query);
    }

    #[tokio::test]
    async fn test_running_query() {
      let network = NETWORKS.get(&ChainId::PolygonMumbai).unwrap();
      let filter = RewardFilter {
        slasher: "0x1234567890123456789012345678901234567890".to_string()
      };
      let result = run_query(network.subgraph_url, &filter).await;
      if let Some(errors) = &result.errors {
          assert_eq!(errors.len(), 0);
      }
      insta::assert_debug_snapshot!(result.data);
    }

    #[tokio::test]
    async fn test_filter_builder() {
        let filter = RewardFilter {
          slasher: "some_address".to_string()
        };

        assert_eq!(filter.slasher, "some_address".to_string());
    }
}