import React, { useState, useEffect, useCallback } from "react";

import DropDown, { ProfileDropDown } from "src/common/DropDown/DropDown";
import { defaultEndpoint } from "src/endpoints";
import history from "src/globalHistory";
import { Link } from "react-router-dom";

import COS from "src/api/COSv2";

import styles from "./Buckets.module.css";
import CreateModal from "./CreateModal";
import DeleteModal from "./DeleteModal";
import Table from "./TableV2";

const accountNameForAccount = (account) => {
  if (account && account.softlayer) {
    return `${account.softlayer} - ${account.name}`;
  } else if (account) {
    return account.name;
  }
};

const ConditionalTable = ({
  loadingAccounts,
  accounts,
  loadingResources,
  resources,
  buckets,
  listOfLoadingBuckets,
  handleDeleteBucket,
  handleCreateBucket,
  handleRowSelected,
  loading,
}) => {
  if (!loadingAccounts && accounts.length === 0) {
    return (
      <div className={styles.noObjectStorage}>
        <div className={styles.noBucketsTitle} style={{ marginTop: "60px" }}>
          Account not yet activated
        </div>
        <div className={styles.noBucketsSub}>
          Your IBM Cloud account hasn't been activated yet. You can activate
          your account by logging into{" "}
          <a
            className={styles.getStartedLink}
            href="https://cloud.ibm.com?cm_mmc=OSocial_Blog-_-Developer_IBM+Developer-_-WW_WW-_-ibmdev-Github-NSB-cloud-annotations-sign-up&cm_mmca1=000037FD&cm_mmca2=10010797"
            target="_blank"
            rel="noopener noreferrer"
          >
            IBM Cloud
          </a>
          . Once activated, refresh this page.
        </div>
        <a
          href="https://cloud.ibm.com?cm_mmc=OSocial_Blog-_-Developer_IBM+Developer-_-WW_WW-_-ibmdev-Github-NSB-cloud-annotations-sign-up&cm_mmca1=000037FD&cm_mmca2=10010797"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.createBucket}
          style={{ height: "48px", marginTop: "40px" }}
        >
          <div className={styles.createBucketText}>Activate your account</div>
        </a>
      </div>
    );
  }

  if (!loadingResources && resources.length === 0) {
    return (
      <div className={styles.noObjectStorage}>
        <div className={styles.noBucketsTitle} style={{ marginTop: "60px" }}>
          No Object Storage instance
        </div>
        <div className={styles.noBucketsSub}>
          We use object storage to save your annotations. You can create an
          Object Storage instance for free on{" "}
          <a
            className={styles.getStartedLink}
            href="https://cloud.ibm.com/catalog/services/cloud-object-storage?cm_mmc=OSocial_Blog-_-Developer_IBM+Developer-_-WW_WW-_-ibmdev-Github-NSB-cloud-annotations-sign-up&cm_mmca1=000037FD&cm_mmca2=10010797"
            target="_blank"
            rel="noopener noreferrer"
          >
            IBM Cloud
          </a>
          . Once created, refresh this page.
        </div>
        <a
          href="https://cloud.ibm.com/catalog/services/cloud-object-storage?cm_mmc=OSocial_Blog-_-Developer_IBM+Developer-_-WW_WW-_-ibmdev-Github-NSB-cloud-annotations-sign-up&cm_mmca1=000037FD&cm_mmca2=10010797"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.createBucket}
          style={{ height: "48px", marginTop: "40px" }}
        >
          <div className={styles.createBucketText}>Get started</div>
        </a>
      </div>
    );
  }

  return (
    <Table
      buckets={buckets}
      listOfLoadingBuckets={listOfLoadingBuckets}
      onDeleteBucket={handleDeleteBucket}
      onCreateBucket={handleCreateBucket}
      onRowSelected={handleRowSelected}
      loading={loading || loadingResources}
    />
  );
};

const Buckets = ({
  profile,
  buckets,
  resources,
  activeResource,
  accounts,
  activeAccount,
  loadingResources,
}) => {
  const [isCreateBucketModalOpen, setIsCreateBucketModalOpen] = useState(false);
  const [bucketToDelete, setBucketToDelete] = useState(false);
  const [loading, setLoading] = useState(false);

  const [listOfLoadingBuckets, setListOfLoadingBuckets] = useState([]);

  const dispatchLoadBuckets = useCallback(async (chosenInstance) => {
    // try {
    //   // We only want to show the loading indicator when we first load the
    //   // page. Don't `setLoading(true)`
    //   dispatch(await loadBuckets(chosenInstance));
    //   setLoading(false);
    // } catch (error) {
    //   console.error(error);
    // }
  }, []);

  useEffect(() => {
    // Loading until activeResource is ready.
    if (!buckets) {
      setLoading(true);
    }
  }, [buckets]);

  useEffect(() => {
    if (activeResource) {
      setLoading(true);
      dispatchLoadBuckets(activeResource);
    }
  }, [activeResource, dispatchLoadBuckets]);

  const handleRowSelected = useCallback(
    (id) => {
      const bucket = buckets.filter((bucket) => bucket.id === id)[0];
      history.push(`/buckets/${bucket.name}?location=${bucket.location}`);
    },
    [buckets]
  );

  const handleCreateBucket = useCallback(() => {
    setIsCreateBucketModalOpen(true);
  }, []);

  const handleCloseCreateModal = useCallback(() => {
    setIsCreateBucketModalOpen(false);
  }, []);

  const handleSubmitCreateModal = useCallback(
    (bucketName) => {
      dispatchLoadBuckets(activeResource);
      setIsCreateBucketModalOpen(false);
      history.push(`/buckets/${bucketName}?location=us`);
    },
    [activeResource, dispatchLoadBuckets]
  );

  const handleDeleteBucket = useCallback((bucketName) => {
    setBucketToDelete(bucketName);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setBucketToDelete(false);
  }, []);

  const handleSubmitDeleteModal = useCallback(
    async (bucketName) => {
      setBucketToDelete(false);
      setListOfLoadingBuckets((list) => [...list, bucketName]);
      try {
        const cos = new COS({ endpoint: defaultEndpoint });

        // Recursively delete 1000 objects at time.
        const deleteAllObjects = async () => {
          const res = await cos.listObjectsV2({ Bucket: bucketName });
          const { Contents = [] } = res.ListBucketResult;
          const contents = Array.isArray(Contents) ? Contents : [Contents];
          const objects = contents.map((item) => ({ Key: item.Key }));
          if (objects.length > 0) {
            await cos.deleteObjects({
              Bucket: bucketName,
              Delete: {
                Objects: objects,
              },
            });
            await deleteAllObjects();
          }
          return;
        };

        await deleteAllObjects();

        await cos.deleteBucket({
          Bucket: bucketName,
        });
      } catch (error) {
        console.error(error);
      }
      await dispatchLoadBuckets(activeResource);
      setListOfLoadingBuckets((list) => list.filter((b) => b !== bucketName));
    },
    [activeResource, dispatchLoadBuckets]
  );

  const handleAccountChosen = useCallback((item) => {
    // dispatch(setActiveAccount(item));
  }, []);

  const handleResourceChosen = useCallback((item) => {
    // dispatch(setActiveResource(item));
  }, []);

  const activeAccountObject = accounts.find(
    (account) => activeAccount === account.accountId
  );

  const activeResourceObject = resources.find(
    (resource) => activeResource === resource.id
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.titleBar}>
        <div className={styles.title}>
          <Link to="/" className={styles.linkOverride}>
            <span className={styles.titlePrefix}>IBM</span>&nbsp;&nbsp;Cloud
            Annotations
          </Link>
        </div>
        <nav className={styles.mainLinks}>
          <a className={styles.link} href="https://cloud.annotations.ai/docs">
            Docs
          </a>
          <a
            className={styles.link}
            href="https://cloud.annotations.ai/workshops"
          >
            Workshops
          </a>
          <a className={styles.link} href="https://cloud.annotations.ai/demos">
            Demos
          </a>
          <a className={styles.link} href="https://cloud.annotations.ai/sdks">
            SDKs
          </a>
          {/* <Link to="/training" className={styles.link}>
            Training runs
          </Link> */}
        </nav>
        <DropDown
          active={
            !loadingResources &&
            activeResourceObject &&
            activeResourceObject.name
          }
          list={resources.map((resource) => ({
            display: resource.name,
            id: resource.id,
          }))}
          onChosen={handleResourceChosen}
        />
        <DropDown
          active={accountNameForAccount(activeAccountObject)}
          list={accounts.map((account) => ({
            display: accountNameForAccount(account),
            id: account.accountId,
          }))}
          onChosen={handleAccountChosen}
        />
        <ProfileDropDown profile={profile} />
      </div>
      <DeleteModal
        isOpen={bucketToDelete}
        onClose={handleCloseDeleteModal}
        onSubmit={handleSubmitDeleteModal}
        itemToDelete={bucketToDelete}
      />
      <CreateModal
        isOpen={isCreateBucketModalOpen}
        onClose={handleCloseCreateModal}
        onSubmit={handleSubmitCreateModal}
        instanceId={activeResource}
      />
      <ConditionalTable
        loadingAccounts={true}
        accounts={accounts}
        loadingResources={loadingResources}
        resources={resources}
        buckets={buckets}
        listOfLoadingBuckets={listOfLoadingBuckets}
        handleDeleteBucket={handleDeleteBucket}
        handleCreateBucket={handleCreateBucket}
        handleRowSelected={handleRowSelected}
        loading={loading}
      />
    </div>
  );
};

export default Buckets;