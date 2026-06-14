use chrono::Utc;
use uuid::Uuid;

use crate::db::*;

/// Build deterministic seed state. Called on startup and on `/api/admin/reset`.
pub fn seed() -> Db {
    let mut db = Db::new();

    // --- Users ---
    let users = [
        ("agent.standard", ScenarioFlag::Standard, "Standard Agent", "ตัวแทนมาตรฐาน", Locale::En),
        ("agent.locked",   ScenarioFlag::Locked,   "Locked Agent",   "ตัวแทนที่ถูกล็อก",  Locale::En),
        ("agent.glitch",   ScenarioFlag::Glitch,   "Glitch Agent",   "ตัวแทนกลิตช์",     Locale::En),
        ("agent.bug",      ScenarioFlag::Bug,      "Buggy Agent",    "ตัวแทนบั๊ก",       Locale::En),
        ("agent.error",    ScenarioFlag::Error,    "Error Agent",    "ตัวแทนเออเรอร์",  Locale::En),
    ];
    let user_ids: Vec<Uuid> = users
        .iter()
        .map(|(username, flag, name_en, name_th, locale)| {
            let id = deterministic_uuid(username);
            let user = User {
                id,
                username: username.to_string(),
                password: "insure_demo".to_string(),
                display_name_en: name_en.to_string(),
                display_name_th: name_th.to_string(),
                role: Role::Agent,
                scenario_flag: *flag,
                locale: *locale,
            };
            db.users.insert(id, user);
            db.users_by_username.insert(username.to_string(), id);
            id
        })
        .collect();
    let standard_id = user_ids[0];

    // --- Catalog: 4 base Life products ---
    db.products = vec![
        CatalogProduct {
            code: "LIFE_TERM".into(),
            name_en: "Term Life".into(),
            name_th: "ประกันชีวิตระยะ".into(),
            description_en: "Pure protection for a fixed term.".into(),
            description_th: "ความคุ้มครองหลักสำหรับระยะเวลาที่กำหนด".into(),
            min_age: 18,
            max_age: 70,
            min_sum_assured: 100_000,
            max_sum_assured: 10_000_000,
            term_options: vec![10, 15, 20, 25, 30],
            // age -> rate per 1000 SA (annual). Simplified linear bands.
            rate_per_thousand: vec![(18, 2.0), (30, 3.5), (40, 6.0), (50, 10.0), (60, 18.0)],
        },
        CatalogProduct {
            code: "LIFE_WHOLE".into(),
            name_en: "Whole Life".into(),
            name_th: "ประกันชีวิตตลอดชีพ".into(),
            description_en: "Lifetime coverage with cash value.".into(),
            description_th: "ความคุ้มครองตลอดชีพพร้อมมูลค่าเงินสด".into(),
            min_age: 18,
            max_age: 65,
            min_sum_assured: 100_000,
            max_sum_assured: 5_000_000,
            term_options: vec![99], // to age 99
            rate_per_thousand: vec![(18, 8.0), (30, 12.0), (40, 18.0), (50, 28.0), (60, 42.0)],
        },
        CatalogProduct {
            code: "LIFE_ENDOW".into(),
            name_en: "Endowment".into(),
            name_th: "ประกันชีวิตแบบออมทรัพย์".into(),
            description_en: "Savings + protection maturing at term end.".into(),
            description_th: "ออมทรัพย์พร้อมความคุ้มครอง ครบกำหนดได้เงินคืน".into(),
            min_age: 18,
            max_age: 60,
            min_sum_assured: 50_000,
            max_sum_assured: 3_000_000,
            term_options: vec![10, 15, 20, 25],
            rate_per_thousand: vec![(18, 35.0), (30, 45.0), (40, 60.0), (50, 80.0)],
        },
        CatalogProduct {
            code: "LIFE_ULIP".into(),
            name_en: "Unit-Linked".into(),
            name_th: "ประกันชีวิตแบบยูนิตลิงก์".into(),
            description_en: "Investment-linked life insurance.".into(),
            description_th: "ประกันชีวิตเชื่อมโยงกับการลงทุน".into(),
            min_age: 18,
            max_age: 70,
            min_sum_assured: 100_000,
            max_sum_assured: 20_000_000,
            term_options: vec![10, 15, 20, 25, 30],
            rate_per_thousand: vec![(18, 5.0), (30, 7.0), (40, 11.0), (50, 17.0), (60, 26.0)],
        },
    ];

    // --- Catalog: 5 rider types × 5-6 plans (~28 rider SKUs) ---
    db.riders = build_riders();

    // --- Sample transactions for agent.standard ---
    let sample = sample_transactions(standard_id);
    db.transactions = sample;

    db
}

fn build_riders() -> Vec<CatalogRiderPlan> {
    let mut riders = Vec::new();
    let types = [
        (RiderType::Health, "HEALTH", "Health", "สุขภาพ", 5),
        (RiderType::Ci,     "CI",     "Critical Illness", "โรคร้ายแรง", 6),
        (RiderType::Pa,     "PA",     "Personal Accident", "อุบัติเหตุ", 6),
        (RiderType::Tpd,    "TPD",    "Total Permanent Disability", "ทุพพลภาพถาวรสิ้นเชิง", 5),
        (RiderType::Wp,     "WP",     "Waiver of Premium", "สละสิทธิ์เบี้ยประกัน", 5),
    ];
    for (rider_type, prefix, name_en, name_th, count) in types {
        for i in 1..=count {
            let code = format!("{prefix}_PLAN_{i}");
            let plan = CatalogRiderPlan {
                code: code.clone(),
                rider_type,
                name_en: format!("{name_en} Plan {i}"),
                name_th: format!("{name_th} แผน {i}"),
                min_age: 18,
                max_age: 65,
                sum_assured_options: [50_000, 100_000, 200_000, 500_000, 1_000_000].to_vec(),
                flat_premium: if matches!(rider_type, RiderType::Wp) {
                    Some(500.0 * i as f64)
                } else {
                    None
                },
                rate_per_thousand: if matches!(rider_type, RiderType::Wp) {
                    None
                } else {
                    Some(vec![
                        (18, 1.0 + 0.2 * i as f64),
                        (30, 2.0 + 0.3 * i as f64),
                        (40, 3.5 + 0.5 * i as f64),
                        (50, 6.0 + 0.8 * i as f64),
                        (60, 10.0 + 1.2 * i as f64),
                    ])
                },
            };
            riders.push(plan);
        }
    }
    riders
}

fn sample_transactions(agent_id: Uuid) -> Vec<Transaction> {
    let now = Utc::now();
    let statuses = [
        ("draft",     TransactionKind::Quotation, "Draft Quotation",     "ใบเสนอราคาฉบับร่าง"),
        ("quoted",    TransactionKind::Quotation, "Finalized Quotation", "ใบเสนอราคาที่ยืนยันแล้ว"),
        ("created",   TransactionKind::Eapp,      "E-Application",       "ใบคำขออิเล็กทรอนิกส์"),
        ("paid",      TransactionKind::Payment,   "Payment",             "การชำระเงิน"),
        ("submitted", TransactionKind::Eapp,      "Submitted E-App",     "ใบคำขอที่ส่งแล้ว"),
        ("policy",    TransactionKind::Policy,    "Policy Issued",       "กรมธรรม์ที่ออกแล้ว"),
    ];
    statuses
        .iter()
        .enumerate()
        .map(|(i, (status, kind, en, th))| Transaction {
            id: deterministic_uuid(&format!("sample-tx-{i}")),
            agent_id,
            kind: *kind,
            reference_id: deterministic_uuid(&format!("sample-ref-{i}")),
            title_en: en.to_string(),
            title_th: th.to_string(),
            summary_en: format!("Reference sample-{i}"),
            summary_th: format!("อ้างอิง sample-{i}"),
            status: status.to_string(),
            created_at: now - chrono::Duration::days((i + 1) as i64),
            updated_at: now - chrono::Duration::days(i as i64),
        })
        .collect()
}

/// Stable UUID from a string key, so seed IDs don't change between runs.
fn deterministic_uuid(key: &str) -> Uuid {
    let mut bytes = [0u8; 16];
    let hash = format!("{key}:{}", key.len());
    for (i, b) in hash.bytes().take(16).enumerate() {
        bytes[i] = b;
    }
    // Ensure version/variant bits are valid-ish (doesn't matter for in-memory use).
    bytes[6] = (bytes[6] & 0x0F) | 0x40;
    bytes[8] = (bytes[8] & 0x3F) | 0x80;
    Uuid::from_bytes(bytes)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn seed_has_expected_counts() {
        let db = seed();
        assert_eq!(db.users.len(), 5);
        assert_eq!(db.products.len(), 4);
        // 5+6+6+5+5 = 27 rider plans
        assert_eq!(db.riders.len(), 27);
        assert!(!db.transactions.is_empty(), "standard agent should have sample transactions");
    }

    #[test]
    fn seed_is_deterministic() {
        let a = seed();
        let b = seed();
        let ua = a.users_by_username.get("agent.standard").copied();
        let ub = b.users_by_username.get("agent.standard").copied();
        assert_eq!(ua, ub);
    }
}
