<?php
/**
 * Tag Parser
 *
 * Extracts and validates tags from event descriptions.
 *
 * @package GCal_Tag_Filter
 */

class GCal_Parser {

    /**
     * Regex pattern for matching tags in format [[[CATEGORY]]]
     */
    const TAG_PATTERN = '/\[\[\[([A-Z0-9_-]+)\]\]\]/i';

    /**
     * Extract tags from description.
     *
     * @param string $description Event description.
     * @return array Array of tags found (validated against whitelist).
     */
    public function extract_tags( $description ) {
        if ( empty( $description ) ) {
            return array();
        }

        // Find all tags matching the pattern
        preg_match_all( self::TAG_PATTERN, $description, $matches );

        if ( empty( $matches[1] ) ) {
            return array();
        }

        // Get raw tags
        $tags = $matches[1];

        // Validate against whitelist
        $validated_tags = $this->validate_tags( $tags );

        return $validated_tags;
    }

    /**
     * Strip tags from description.
     *
     * @param string $description Event description.
     * @return string Clean description without tags.
     */
    public function strip_tags( $description ) {
        if ( empty( $description ) ) {
            return '';
        }

        // Remove all tag patterns
        $clean = preg_replace( self::TAG_PATTERN, '', $description );

        // Trim extra whitespace
        $clean = trim( $clean );

        // Remove multiple consecutive newlines
        $clean = preg_replace( '/\n\s*\n+/', "\n\n", $clean );

        return $clean;
    }

    /**
     * Validate tags against whitelist.
     *
     * @param array $tags Array of tag strings.
     * @return array Array with 'valid' and 'invalid' tags.
     */
    private function validate_tags( $tags ) {
        $categories = GCal_Categories::get_categories();

        if ( empty( $categories ) ) {
            return array(
                'valid'   => array(),
                'invalid' => $tags, // All tags are invalid if no categories defined
            );
        }

        // Get valid category IDs
        $valid_ids = array_column( $categories, 'id' );

        // Normalize to uppercase for comparison
        $valid_ids = array_map( 'strtoupper', $valid_ids );

        // Filter tags
        $validated = array();
        $invalid = array();
        foreach ( $tags as $tag ) {
            $tag_upper = strtoupper( trim( $tag ) );

            if ( in_array( $tag_upper, $valid_ids, true ) ) {
                $validated[] = $tag_upper;
            } else {
                $invalid[] = $tag_upper;
                // Log invalid tag for admin awareness
                if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
                    error_log( sprintf(
                        'GCal Tag Filter: Invalid tag "%s" found in event. Not in whitelist.',
                        $tag
                    ) );
                }
            }
        }

        return array(
            'valid'   => array_unique( $validated ),
            'invalid' => array_unique( $invalid ),
        );
    }

    /**
     * Check if a tag is valid according to whitelist.
     *
     * @param string $tag Tag to check.
     * @return bool True if valid, false otherwise.
     */
    public function is_valid_tag( $tag ) {
        $categories = GCal_Categories::get_categories();

        if ( empty( $categories ) ) {
            return false;
        }

        $valid_ids = array_column( $categories, 'id' );
        $valid_ids = array_map( 'strtoupper', $valid_ids );
        $tag_upper = strtoupper( trim( $tag ) );

        return in_array( $tag_upper, $valid_ids, true );
    }

    /**
     * Validate tag ID format (for admin input).
     *
     * Tag IDs must be uppercase alphanumeric with underscores/hyphens only.
     *
     * @param string $tag_id Tag ID to validate.
     * @return bool True if valid format, false otherwise.
     */
    public static function is_valid_tag_format( $tag_id ) {
        return (bool) preg_match( '/^[A-Z0-9_-]+$/', $tag_id );
    }
}
