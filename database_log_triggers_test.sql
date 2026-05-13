/* =========================================================
   LOGGING TRIGGERS FOR GAPANGITA SYSTEM
   ========================================================= */

DELIMITER $$

/* =========================================================
   USERS
   ========================================================= */

DROP TRIGGER IF EXISTS trg_log_users_insert$$
CREATE TRIGGER trg_log_users_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO LOGS (
        log_code,
        user_code,
        action_doer,
        affected_record_id,
        action_name,
        action_details,
        action_datetime
    )
    VALUES (
        NULL,
        NEW.user_code,
        IFNULL(@logged_in_username, 'SYSTEM'),
        NEW.user_code,
        'INSERT USER',
        CONCAT(
            'Inserted user: Username=', NEW.username,
            ', Email=', NEW.email,
            ', Contact=', NEW.contact_number
        ),
        NOW()
    );
END$$

DROP TRIGGER IF EXISTS trg_log_users_update$$
CREATE TRIGGER trg_log_users_update
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    INSERT INTO LOGS (
        log_code,
        user_code,
        action_doer,
        affected_record_id,
        action_name,
        action_details,
        action_datetime
    )
    VALUES (
        NULL,
        NEW.user_code,
        IFNULL(@logged_in_username, 'SYSTEM'),
        NEW.user_code,
        'UPDATE USER',
        CONCAT(
            'Updated user: Username ', OLD.username, ' -> ', NEW.username,
            ', Email ', OLD.email, ' -> ', NEW.email,
            ', Contact ', OLD.contact_number, ' -> ', NEW.contact_number
        ),
        NOW()
    );
END$$

DROP TRIGGER IF EXISTS trg_log_users_delete$$
CREATE TRIGGER trg_log_users_delete
AFTER DELETE ON users
FOR EACH ROW
BEGIN
    INSERT INTO LOGS (
        log_code,
        user_code,
        action_doer,
        affected_record_id,
        action_name,
        action_details,
        action_datetime
    )
    VALUES (
        NULL,
        OLD.user_code,
        IFNULL(@logged_in_username, 'SYSTEM'),
        OLD.user_code,
        'DELETE USER',
        CONCAT(
            'Deleted user: Username=', OLD.username,
            ', Email=', OLD.email
        ),
        NOW()
    );
END$$


/* =========================================================
   CATEGORIES
   ========================================================= */

DROP TRIGGER IF EXISTS trg_log_categories_insert$$
CREATE TRIGGER trg_log_categories_insert
AFTER INSERT ON categories
FOR EACH ROW
BEGIN
    INSERT INTO LOGS (
        log_code,
        user_code,
        action_doer,
        affected_record_id,
        action_name,
        action_details,
        action_datetime
    )
    VALUES (
        NULL,
        @logged_in_user_code,
        IFNULL(@logged_in_username, 'SYSTEM'),
        NEW.category_code,
        'INSERT CATEGORY',
        CONCAT(
            'Inserted category: Name=', NEW.NAME
        ),
        NOW()
    );
END$$

DROP TRIGGER IF EXISTS trg_log_categories_update$$
CREATE TRIGGER trg_log_categories_update
AFTER UPDATE ON categories
FOR EACH ROW
BEGIN
    INSERT INTO LOGS (
        log_code,
        user_code,
        action_doer,
        affected_record_id,
        action_name,
        action_details,
        action_datetime
    )
    VALUES (
        NULL,
        @logged_in_user_code,
        IFNULL(@logged_in_username, 'SYSTEM'),
        NEW.category_code,
        'UPDATE CATEGORY',
        CONCAT(
            'Updated category: Name ', OLD.NAME,
            ' -> ', NEW.NAME
        ),
        NOW()
    );
END$$

DROP TRIGGER IF EXISTS trg_log_categories_delete$$
CREATE TRIGGER trg_log_categories_delete
AFTER DELETE ON categories
FOR EACH ROW
BEGIN
    INSERT INTO LOGS (
        log_code,
        user_code,
        action_doer,
        affected_record_id,
        action_name,
        action_details,
        action_datetime
    )
    VALUES (
        NULL,
        @logged_in_user_code,
        IFNULL(@logged_in_username, 'SYSTEM'),
        OLD.category_code,
        'DELETE CATEGORY',
        CONCAT(
            'Deleted category: Name=', OLD.NAME
        ),
        NOW()
    );
END$$


/* =========================================================
   BRANCHES
   ========================================================= */

DROP TRIGGER IF EXISTS trg_log_branches_insert$$
CREATE TRIGGER trg_log_branches_insert
AFTER INSERT ON branches
FOR EACH ROW
BEGIN
    INSERT INTO LOGS (
        log_code,
        user_code,
        action_doer,
        affected_record_id,
        action_name,
        action_details,
        action_datetime
    )
    VALUES (
        NULL,
        @logged_in_user_code,
        IFNULL(@logged_in_username, 'SYSTEM'),
        NEW.branch_code,
        'INSERT BRANCH',
        CONCAT(
            'Inserted branch: Name=', NEW.NAME
        ),
        NOW()
    );
END$$

DROP TRIGGER IF EXISTS trg_log_branches_update$$
CREATE TRIGGER trg_log_branches_update
AFTER UPDATE ON branches
FOR EACH ROW
BEGIN
    INSERT INTO LOGS (
        log_code,
        user_code,
        action_doer,
        affected_record_id,
        action_name,
        action_details,
        action_datetime
    )
    VALUES (
        NULL,
        @logged_in_user_code,
        IFNULL(@logged_in_username, 'SYSTEM'),
        NEW.branch_code,
        'UPDATE BRANCH',
        CONCAT(
            'Updated branch: Name ', OLD.NAME,
            ' -> ', NEW.NAME
        ),
        NOW()
    );
END$$

DROP TRIGGER IF EXISTS trg_log_branches_delete$$
CREATE TRIGGER trg_log_branches_delete
AFTER DELETE ON branches
FOR EACH ROW
BEGIN
    INSERT INTO LOGS (
        log_code,
        user_code,
        action_doer,
        affected_record_id,
        action_name,
        action_details,
        action_datetime
    )
    VALUES (
        NULL,
        @logged_in_user_code,
        IFNULL(@logged_in_username, 'SYSTEM'),
        OLD.branch_code,
        'DELETE BRANCH',
        CONCAT(
            'Deleted branch: Name=', OLD.NAME
        ),
        NOW()
    );
END$$


/* =========================================================
   LOCATIONS
   ========================================================= */

DROP TRIGGER IF EXISTS trg_log_locations_insert$$
CREATE TRIGGER trg_log_locations_insert
AFTER INSERT ON locations
FOR EACH ROW
BEGIN
    INSERT INTO LOGS (
        log_code,
        user_code,
        action_doer,
        affected_record_id,
        action_name,
        action_details,
        action_datetime
    )
    VALUES (
        NULL,
        @logged_in_user_code,
        IFNULL(@logged_in_username, 'SYSTEM'),
        NEW.location_code,
        'INSERT LOCATION',
        CONCAT(
            'Inserted location: Name=', NEW.NAME
        ),
        NOW()
    );
END$$

DROP TRIGGER IF EXISTS trg_log_locations_update$$
CREATE TRIGGER trg_log_locations_update
AFTER UPDATE ON locations
FOR EACH ROW
BEGIN
    INSERT INTO LOGS (
        log_code,
        user_code,
        action_doer,
        affected_record_id,
        action_name,
        action_details,
        action_datetime
    )
    VALUES (
        NULL,
        @logged_in_user_code,
        IFNULL(@logged_in_username, 'SYSTEM'),
        NEW.location_code,
        'UPDATE LOCATION',
        CONCAT(
            'Updated location: Name ', OLD.NAME,
            ' -> ', NEW.NAME
        ),
        NOW()
    );
END$$

DROP TRIGGER IF EXISTS trg_log_locations_delete$$
CREATE TRIGGER trg_log_locations_delete
AFTER DELETE ON locations
FOR EACH ROW
BEGIN
    INSERT INTO LOGS (
        log_code,
        user_code,
        action_doer,
        affected_record_id,
        action_name,
        action_details,
        action_datetime
    )
    VALUES (
        NULL,
        @logged_in_user_code,
        IFNULL(@logged_in_username, 'SYSTEM'),
        OLD.location_code,
        'DELETE LOCATION',
        CONCAT(
            'Deleted location: Name=', OLD.NAME
        ),
        NOW()
    );
END$$


/* =========================================================
   ITEMS
   ========================================================= */
DELIMITER $$
DROP TRIGGER IF EXISTS trg_log_items_insert$$
CREATE TRIGGER trg_log_items_insert
AFTER INSERT ON items
FOR EACH ROW
BEGIN
    INSERT INTO LOGS (
        log_code,
        user_code,
        action_doer,
        affected_record_id,
        action_name,
        action_details,
        action_datetime
    )
    VALUES (
        NULL,
        @logged_in_user_code,
        IFNULL(@logged_in_username, 'SYSTEM'),
        NEW.item_code,
        'INSERT ITEM',
        CONCAT(
            'Inserted item: Name=', NEW.NAME,
            ', Type=', NEW.item_type,
            ', Status=', NEW.STATUS,
            ', Category=', NEW.category_code,
            ', Branch=', NEW.branch_code,
            ', Location=', NEW.location_code,
            ', Reporter User=', NEW.reporter_user_code,
            ', Description=', NEW.description        
        ),
        NOW()
    );
END$$

DROP TRIGGER IF EXISTS trg_log_items_update$$
CREATE TRIGGER trg_log_items_update
AFTER UPDATE ON items
FOR EACH ROW
BEGIN
    INSERT INTO LOGS (
        log_code,
        user_code,
        action_doer,
        affected_record_id,
        action_name,
        action_details,
        action_datetime
    )
    VALUES (
        NULL,
        @logged_in_user_code,
        IFNULL(@logged_in_username, 'SYSTEM'),
        NEW.item_code,
        'UPDATE ITEM',
        CONCAT(
            'Updated item: Name ', OLD.NAME,
            ' -> ', NEW.NAME,
            ', Status ', OLD.STATUS,
            ' -> ', NEW.STATUS,
            ', Type ', OLD.item_type,
            ' -> ', NEW.item_type
        ),
        NOW()
    );
END$$

DROP TRIGGER IF EXISTS trg_log_items_delete$$
CREATE TRIGGER trg_log_items_delete
AFTER DELETE ON items
FOR EACH ROW
BEGIN
    INSERT INTO LOGS (
        log_code,
        user_code,
        action_doer,
        affected_record_id,
        action_name,
        action_details,
        action_datetime
    )
    VALUES (
        NULL,
        @logged_in_user_code,
        IFNULL(@logged_in_username, 'SYSTEM'),
        OLD.item_code,
        'DELETE ITEM',
        CONCAT(
            'Deleted item: Name=', OLD.NAME,
            ', Type=', OLD.item_type
        ),
        NOW()
    );
END$$

DELIMITER ;