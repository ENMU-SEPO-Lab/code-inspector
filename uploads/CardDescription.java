import java.util.Scanner;

/**
 * @author Essa Imhmed
 */

public class CardDescription {

    /**
     * Converts shorthand notation of a card rank and suit into its full description.
     *
     * @param rank The rank of the card (A, 2-10, J, Q, K)
     * @param suit The suit of the card (D, H, S, C)
     * @return The full description of the card (e.g., "Queen of Spades")
     */
    public static String getCardDescription(String rank, String suit) {
        String rankDescription = "";
        String suitDescription = "";

        // Determine rank description
        if (rank.equals("A")) {
            rankDescription = "Ace";
        } else if (rank.equals("J")) {
            rankDescription = "Jack";
        } else if (rank.equals("Q")) {
            rankDescription = "Queen";
        } else if (rank.equals("K")) {
            rankDescription = "King";
        } else {
            try {
                int num = Integer.parseInt(rank);
                if (num >= 2 && num <= 10) {
                    rankDescription = rank;
                } else {
                    return "Invalid card rank";
                }
            } catch (NumberFormatException e) {
                return "Invalid card rank";
            }
        }

        // Determine suit description
        switch (suit) {
            case "D":
                suitDescription = "Diamonds";
                break;
            case "H":
                suitDescription = "Hearts";
                break;
            case "S":
                suitDescription = "Spades";
                break;
            case "C":
                suitDescription = "Clubs";
                break;
            default:
                return "Invalid card suit";
        }

        return rankDescription + " of " + suitDescription;
    }

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        while (true) {
            System.out.print("Enter card notation (e.g., QS, 10H) or 'exit' to quit: ");
            String notation = scanner.next().toUpperCase().trim();

            if (notation.equals("EXIT")) {
                break;
            }

            String rank, suit;

            // Validate input length
            if (notation.length() == 2) {
                rank = notation.substring(0, 1);
                suit = notation.substring(1, 2);
            } else if (notation.length() == 3 && notation.startsWith("10")) {
                rank = "10";
                suit = notation.substring(2, 3);
            } else {
                System.out.println("Invalid input! Please enter a valid card notation.\n");
                continue;
            }

            System.out.println(getCardDescription(rank, suit) + "\n");
        }

        scanner.close();
    }
}
