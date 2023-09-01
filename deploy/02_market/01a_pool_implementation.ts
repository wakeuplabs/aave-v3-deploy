import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { COMMON_DEPLOY_PARAMS } from "../../helpers/env";
import {
  POOL_ADDRESSES_PROVIDER_ID,
  POOL_IMPL_ID,
} from "../../helpers/deploy-ids";
import { MARKET_NAME } from "../../helpers/env";
import {
  ConfigNames,
  eNetwork,
  getPool,
  getPoolLibraries,
  isL2PoolSupported,
  loadPoolConfig,
  waitForTx,
} from "../../helpers";

const func: DeployFunction = async function ({
  getNamedAccounts,
  deployments,
  ...hre
}: HardhatRuntimeEnvironment) {
  console.log("Chris: init pool deployment")

  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const poolConfig = await loadPoolConfig(MARKET_NAME as ConfigNames);

  console.log("Chris: load pool config", poolConfig)


  const network = (
    process.env.FORK ? process.env.FORK : hre.network.name
  ) as eNetwork;

  const { address: addressesProviderAddress } = await deployments.get(
    POOL_ADDRESSES_PROVIDER_ID
  );

  console.log("Chris: get provider address", POOL_ADDRESSES_PROVIDER_ID, addressesProviderAddress)

  if (isL2PoolSupported(poolConfig)) {
    console.log(
      `[INFO] Skipped common Pool due current network '${network}' is not supported`
    );
    return;
  }
  const commonLibraries = await getPoolLibraries();

  console.log("Chris: get pool libraries", commonLibraries)


  // Deploy common Pool contract
  const poolArtifact = await deploy(POOL_IMPL_ID, {
    contract: "Pool",
    from: deployer,
    args: [addressesProviderAddress],
    libraries: {
      ...commonLibraries,
    },
    ...COMMON_DEPLOY_PARAMS,
  });

  console.log("Chris: deploy pool artifact", poolArtifact)


  // Initialize implementation
  const pool = await getPool(poolArtifact.address);

  console.log("Chris: get pool", poolArtifact.address, pool)

  const poolInitialized = await pool.initialize(addressesProviderAddress)

  console.log("Chris: pool initialized", poolInitialized)

  await waitForTx(poolInitialized);

  console.log("Chris: wait for tx")


  console.log("Initialized Pool Implementation");
};

func.id = "PoolImplementation";
func.tags = ["market"];

export default func;
