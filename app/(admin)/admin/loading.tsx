import styles from "./admin.module.css";

export default function AdminLoading() {
  return (
    <div className={styles.adminContent}>
      {/* Page Header Skeleton */}
      <div className={styles.pageHeader} style={{ marginBottom: 28 }}>
        <div>
          <div className={styles.skeleton} style={{ width: 180, height: 32, marginBottom: 8 }} />
          <div className={styles.skeleton} style={{ width: 280, height: 16 }} />
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className={styles.statsGrid} style={{ marginBottom: 28 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={styles.statCard} style={{ height: 120 }}>
            <div className={styles.skeleton} style={{ width: 40, height: 40, borderRadius: 10, marginBottom: 12 }} />
            <div className={styles.skeleton} style={{ width: 80, height: 28, marginBottom: 8 }} />
            <div className={styles.skeleton} style={{ width: 120, height: 12 }} />
          </div>
        ))}
      </div>

      {/* Main Block Skeleton */}
      <div className={styles.adminCard}>
        <div className={styles.adminCardHeader}>
          <div className={styles.skeleton} style={{ width: 150, height: 20 }} />
          <div className={styles.skeleton} style={{ width: 100, height: 32, borderRadius: 8 }} />
        </div>
        <div className={styles.adminCardBody} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div className={styles.skeleton} style={{ width: 40, height: 40, borderRadius: 8, flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <div className={styles.skeleton} style={{ width: "40%", height: 14 }} />
                <div className={styles.skeleton} style={{ width: "20%", height: 10 }} />
              </div>
              <div className={styles.skeleton} style={{ width: 80, height: 24, borderRadius: 12 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
