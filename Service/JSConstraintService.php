<?php

namespace JJB\FormUtilsBundle\Service;

use Symfony\Bundle\FrameworkBundle\Translation\Translator;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\Constraints;
use CSID\IMC\Baseline\CoreBundle\Component\RegexPatterns AS Pattern;
use CSID\IMC\Baseline\PortalBundle\Validator\Constraints AS CustomConstraints;

class JSConstraintService
{
    /**
     * Types of constraints that we currently support
     */
    const CONSTRAINT_TYPE_LENGTH            = 'Length';
    const CONSTRAINT_TYPE_REGEX             = 'Regex';
    const CONSTRAINT_TYPE_NOTBLANK          = 'NotBlank';
    const CONSTRAINT_TYPE_EMAIL             = 'Email';
    const CUSTOM_CONSTRAINT_TYPE_MATCH      = 'Match';
    const CUSTOM_CONSTRAINT_TYPE_GROUP      = 'Group';
    const CUSTOM_CONSTRAINT_TYPE_LUHN       = 'Luhn';
    const CUSTOM_CONSTRAINT_TYPE_BINCODE    = 'BinCodeConstraint';

    /**
     * @var Translator
     */
    private $translator;


    public function __construct(Translator $translator)
    {
        $this->translator = $translator;
    }

    /**
     * @param Constraint $c
     * @param null|string $domain
     * @param null|array $tests
     * @param null|array $messages
     * @return array
     */
    public function extractConstraints(Constraint $c, $domain = null, $tests = [], $messages = [])
    {
        $namespace  = get_class($c);
        $parts      = explode('\\', $namespace);
        $class      = array_pop($parts);

        switch ($class) {

            case self::CONSTRAINT_TYPE_NOTBLANK:
                /** @var Constraints\NotBlank $c */
                $tests[]    = Pattern::NOT_BLANK;
                $messages[] = $this->trans($c->message, [], $domain);

                break;

            case self::CONSTRAINT_TYPE_LENGTH:
                /** @var Constraints\Length $c */
                if ($c->min > 0 && $c->max > 0 && ($c->min === $c->max)) {
                    $tests[]    = '^.{' . $c->min . ',' . $c->max . '}$';
                    $messages[] = str_replace(
                        '{{ '.$c->min.' }}',
                        $c->min, // can use either min or max (they're the same)
                        $this->trans($c->exactMessage, [
                            'limit' => $c->min
                        ], $domain)
                    );
                } else {
                    if ($c->min > 0) {
                        $tests[]    = '.{' . $c->min . ',}';
                        $messages[] = str_replace(
                            '{{ '.$c->min.' }}',
                            $c->min,
                            $this->trans($c->minMessage, [
                                'limit' => $c->min
                            ], $domain)
                        );
                    }

                    if ($c->max > 0) {
                        $tests[]    = '^.{0,' . $c->max . '}$';
                        $messages[] = str_replace(
                            '{{ '.$c->max.' }}',
                            $c->max,
                            $this->trans($c->maxMessage, [
                                'limit' => $c->max
                            ], $domain)
                        );
                    }
                }

                break;

            case self::CONSTRAINT_TYPE_REGEX:
                /** @var Constraints\Regex $c */
                $tests[]    = str_replace('/', '', $c->pattern);
                $messages[] = $this->trans($c->message, [], $domain);

                break;

            case self::CUSTOM_CONSTRAINT_TYPE_MATCH:
                /** @var CustomConstraints\Match $c */
                $tests[]    = '__MATCH__' . ($c->field_id ? $c->field_id : $c->field);
                $messages[] = $this->trans($c->message, [], $domain);

                break;

            case self::CUSTOM_CONSTRAINT_TYPE_GROUP:
                /** @var CustomConstraints\Group $c */
                $tests[]    = '__GROUP__' . implode(array_keys($c->fields), ',');
                $messages[] = $this->trans($c->message, [], $domain);

                break;

            case self::CUSTOM_CONSTRAINT_TYPE_LUHN:
                /** @var CustomConstraints\Luhn $c */
                $tests[]    = '__LUHN__' . $c->field_id;
                $messages[] = $this->trans($c->message, [], $domain);
                break;

            case self::CUSTOM_CONSTRAINT_TYPE_BINCODE:
                /** @var CustomConstraints\BincodeConstraint $c */
                $tests[]    = '__BINCODE__';
                $messages[] = $this->trans($c->message, [], $domain);
                break;

            case self::CONSTRAINT_TYPE_EMAIL:
                /** @var Constraints\Email $c */
                $tests[]    = Pattern::EMAIL;
                $messages[] = $this->trans($c->message, [], $domain);
                break;

            default:
                break;
        }

        return [$tests, $messages];
    }

    /**
     * @param string $string
     * @param string array $params
     * @param $domain
     * @return string
     */
    private function trans($string, array $params = [], $domain)
    {
        return $this->translator->trans($string, $params, $domain);
    }
}